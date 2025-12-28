import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const QUESTIONS_PER_PROMPT = 5;
const FEEDBACK_INTERVAL_DAYS = 7;
const FEEDBACK_POINTS_REWARD = 30;

interface FeedbackQuestion {
  id: string;
  question_text: string;
  category: string;
  sort_order: number;
  requires_financial_access?: boolean;
}

interface FeedbackStatus {
  last_feedback_at: string | null;
  next_feedback_due: string | null;
  feedback_count: number;
  last_questions_shown: string[];
  onboarded_at: string;
}

interface FeedbackAnswer {
  question_id: string;
  rating: number | null;
  comment: string;
}

export function useFeedbackPrompt() {
  const { user } = useAuth();
  const [shouldShowFeedback, setShouldShowFeedback] = useState(false);
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userFinancialAccess, setUserFinancialAccess] = useState<boolean>(true);

  useEffect(() => {
    if (user?.id) {
      checkFeedbackStatus().catch(err => {
        console.error('Error in feedback status check:', err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const fetchFinancialAccess = async () => {
      if (!user) return;
      try {
        const { data: userData } = await supabase
          .rpc('get_user_team_info', { p_user_id: user.id });
        if (userData && userData.length > 0) {
          setUserFinancialAccess(userData[0].view_financial !== false);
        }
      } catch (err) {
        console.error('Error fetching financial access:', err);
      }
    };
    fetchFinancialAccess();
  }, [user]);

  const checkFeedbackStatus = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Skip feedback prompts for RocketHub team
      const userTeamId = user.user_metadata?.team_id;
      const ROCKETHUB_TEAM_ID = 'e2174edc-4291-4509-81e6-7293a769c41f';

      if (userTeamId === ROCKETHUB_TEAM_ID) {
        setLoading(false);
        return;
      }

      // Check if welcome screen was completed and if 24 hours have passed
      if (userTeamId) {
        const { data: teamSettings } = await supabase
          .from('team_settings')
          .select('welcome_completed_at')
          .eq('team_id', userTeamId)
          .maybeSingle();

        if (teamSettings?.welcome_completed_at) {
          const welcomeCompletedAt = new Date(teamSettings.welcome_completed_at);
          const now = new Date();
          const hoursSinceWelcome = (now.getTime() - welcomeCompletedAt.getTime()) / (1000 * 60 * 60);

          // If less than 24 hours since welcome, don't show feedback
          if (hoursSinceWelcome < 24) {
            console.log(`⏰ Feedback delayed: ${Math.round(24 - hoursSinceWelcome)} hours remaining`);
            setLoading(false);
            return;
          }
        } else {
          // If welcome hasn't been completed yet, don't show feedback
          console.log('⏰ Feedback delayed: Waiting for welcome screen completion');
          setLoading(false);
          return;
        }
      }

      const { data: status, error: statusError } = await supabase
        .from('user_feedback_status')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (statusError) {
        if (statusError.code === '42P01') {
          console.warn('Feedback system tables not yet created - skipping feedback prompt');
          setLoading(false);
          return;
        }
        if (statusError.code !== 'PGRST116') {
          console.error('Error fetching feedback status:', statusError);
          setLoading(false);
          return;
        }
      }

      if (!status) {
        await initializeFeedbackStatus();
        setLoading(false);
        return;
      }

      const now = new Date();
      const nextDue = status.next_feedback_due ? new Date(status.next_feedback_due) : null;

      if (nextDue && now >= nextDue) {
        const selectedQuestions = await selectRotatingQuestions(status.last_questions_shown || [], userFinancialAccess);
        if (selectedQuestions.length > 0) {
          setQuestions(selectedQuestions);
          setShouldShowFeedback(true);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error checking feedback status:', err);
      setLoading(false);
    }
  };

  const initializeFeedbackStatus = async () => {
    if (!user?.id) return;

    try {
      const now = new Date();
      const nextDue = new Date(now.getTime() + FEEDBACK_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

      await supabase.from('user_feedback_status').insert({
        user_id: user.id,
        onboarded_at: now.toISOString(),
        next_feedback_due: nextDue.toISOString(),
        feedback_count: 0,
        last_questions_shown: []
      });
    } catch (err) {
      console.error('Error initializing feedback status:', err);
    }
  };

  const selectRotatingQuestions = async (lastQuestionsShown: string[], hasFinancialAccess: boolean): Promise<FeedbackQuestion[]> => {
    try {
      const { data: allQuestions, error } = await supabase
        .from('feedback_questions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          console.warn('Feedback questions table not yet created');
          return [];
        }
        throw error;
      }
      if (!allQuestions || allQuestions.length === 0) return [];

      const eligibleQuestions = allQuestions.filter(q => {
        if (q.requires_financial_access && !hasFinancialAccess) {
          return false;
        }
        return true;
      });

      const availableQuestions = eligibleQuestions.filter(
        q => !lastQuestionsShown.includes(q.id)
      );

      let questionsToShow: FeedbackQuestion[];

      if (availableQuestions.length >= QUESTIONS_PER_PROMPT) {
        questionsToShow = availableQuestions.slice(0, QUESTIONS_PER_PROMPT);
      } else {
        questionsToShow = [
          ...availableQuestions,
          ...eligibleQuestions.filter(q => !availableQuestions.some(aq => aq.id === q.id)).slice(0, QUESTIONS_PER_PROMPT - availableQuestions.length)
        ];
      }

      return questionsToShow;
    } catch (err) {
      console.error('Error selecting questions:', err);
      return [];
    }
  };

  const submitFeedback = async (answers: FeedbackAnswer[], generalFeedback?: string) => {
    if (!user?.id) throw new Error('User not authenticated');
    if (answers.some(a => a.rating === null)) {
      throw new Error('All ratings are required');
    }

    setSubmitting(true);

    try {
      const teamId = user.user_metadata?.team_id || null;

      const { data: submission, error: submissionError } = await supabase
        .from('user_feedback_submissions')
        .insert({
          user_id: user.id,
          team_id: teamId,
          submitted_at: new Date().toISOString(),
          general_feedback: generalFeedback || null
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      const answerRecords = answers.map(a => ({
        submission_id: submission.id,
        question_id: a.question_id,
        rating: a.rating!,
        comment: a.comment || null
      }));

      const { error: answersError } = await supabase
        .from('user_feedback_answers')
        .insert(answerRecords);

      if (answersError) throw answersError;

      const now = new Date();
      const nextDue = new Date(now.getTime() + FEEDBACK_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
      const questionIds = answers.map(a => a.question_id);

      const { data: currentStatus } = await supabase
        .from('user_feedback_status')
        .select('feedback_count')
        .eq('user_id', user.id)
        .single();

      const { error: statusError } = await supabase
        .from('user_feedback_status')
        .update({
          last_feedback_at: now.toISOString(),
          next_feedback_due: nextDue.toISOString(),
          feedback_count: (currentStatus?.feedback_count || 0) + 1,
          last_questions_shown: questionIds,
          updated_at: now.toISOString()
        })
        .eq('user_id', user.id);

      if (statusError) throw statusError;

      await awardFeedbackPoints();

      setShouldShowFeedback(false);
      setQuestions([]);
      setSubmitting(false);
    } catch (err: any) {
      setSubmitting(false);
      throw new Error(err.message || 'Failed to submit feedback');
    }
  };

  const awardFeedbackPoints = async () => {
    if (!user?.id) return;

    try {
      const { data: existingPoints } = await supabase
        .from('launch_points_ledger')
        .select('id')
        .eq('user_id', user.id)
        .eq('reason', 'feedback_completed')
        .gte('created_at', new Date(Date.now() - FEEDBACK_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (existingPoints) return;

      await supabase
        .from('launch_points_ledger')
        .insert({
          user_id: user.id,
          points: FEEDBACK_POINTS_REWARD,
          reason: 'feedback_completed',
          reason_display: 'Completed weekly feedback survey',
          stage: 'boosters',
          metadata: { feedback_date: new Date().toISOString() }
        });

      const { data: currentStatus } = await supabase
        .from('user_launch_status')
        .select('total_points')
        .eq('user_id', user.id)
        .maybeSingle();

      if (currentStatus) {
        await supabase
          .from('user_launch_status')
          .update({
            total_points: (currentStatus.total_points || 0) + FEEDBACK_POINTS_REWARD,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error('Error awarding feedback points:', err);
    }
  };

  const skipFeedback = async () => {
    if (!user?.id) throw new Error('User not authenticated');

    setSubmitting(true);

    try {
      const now = new Date();
      const nextDue = new Date(now.getTime() + FEEDBACK_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

      const { error: statusError } = await supabase
        .from('user_feedback_status')
        .update({
          next_feedback_due: nextDue.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('user_id', user.id);

      if (statusError) throw statusError;

      setShouldShowFeedback(false);
      setQuestions([]);
      setSubmitting(false);
    } catch (err: any) {
      setSubmitting(false);
      throw new Error(err.message || 'Failed to skip feedback');
    }
  };

  return {
    shouldShowFeedback,
    questions,
    loading,
    submitting,
    submitFeedback,
    skipFeedback,
    pointsReward: FEEDBACK_POINTS_REWARD
  };
}
