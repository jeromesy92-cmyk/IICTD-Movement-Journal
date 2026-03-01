import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';

interface GuidedTourProps {
  run: boolean;
  setRun: (run: boolean) => void;
  userRole: string;
  userId: number;
}

export default function GuidedTour({ run, setRun, userRole, userId }: GuidedTourProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(0);

  const isAdmin = useMemo(() => userRole === 'Administrator' || userRole === 'System Administrator', [userRole]);
  const isSenior = useMemo(() => isAdmin || userRole === 'Senior Field Engineer', [isAdmin, userRole]);

  const steps: Step[] = useMemo(() => [
    {
      target: 'body',
      content: 'Welcome to the system! Let us take a quick tour to show you how to navigate around.',
      placement: 'center' as const,
      disableBeacon: true,
    },
    {
      target: '.nav-dashboard',
      content: 'The Dashboard gives you a high-level overview of system activities, statistics, and recent updates.',
      placement: 'right' as const,
      disableBeacon: true,
    },
    {
      target: '.nav-movements',
      content: 'The Movement Journal is where you can log, view, and manage personnel movements and assignments.',
      placement: 'right' as const,
      disableBeacon: true,
    },
    {
      target: '.nav-org-chart',
      content: 'The Organization Chart helps you visualize the reporting hierarchy and team structure.',
      placement: 'right' as const,
      disableBeacon: true,
    },
    {
      target: '.nav-movement-map',
      content: 'The Movement Map provides a geographical view of where personnel are currently deployed.',
      placement: 'right' as const,
      disableBeacon: true,
    },
    ...(isSenior ? [
      {
        target: '.nav-reports',
        content: 'As a senior staff member, you can access Reports to generate detailed analytics and summaries.',
        placement: 'right' as const,
        disableBeacon: true,
      }
    ] : []),
    ...(isAdmin ? [
      {
        target: '.nav-users',
        content: 'In User Management, you can add new users, update roles, and manage system access.',
        placement: 'right' as const,
        disableBeacon: true,
      },
      {
        target: '.nav-audit',
        content: 'Audit Trails allow you to track system changes, logins, and administrative actions for security purposes.',
        placement: 'right' as const,
        disableBeacon: true,
      }
    ] : []),
    {
      target: '.nav-profile',
      content: 'Your Profile lets you update your personal information, avatar, and view your recent activity.',
      placement: 'right' as const,
      disableBeacon: true,
    },
    {
      target: '.nav-settings',
      content: 'Settings allows you to configure your preferences, notifications, and system appearance.',
      placement: 'right' as const,
      disableBeacon: true,
    }
  ], [isAdmin, isSenior]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, action } = data;
    
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRun(false);
      setStepIndex(0);
      localStorage.setItem(`iictd_tour_seen_${userId}`, 'true');
      return;
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      setStepIndex(nextIndex);
    }
  }, [setRun, userId]);

  return (
    <Joyride
      key={`${userRole}-${userId}`}
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling={false}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          backgroundColor: 'hsl(var(--card))',
          textColor: 'hsl(var(--card-foreground))',
          arrowColor: 'hsl(var(--card))',
          zIndex: 10000,
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
        },
        tooltipContainer: {
          textAlign: 'left',
          borderRadius: '12px',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: '8px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: '10px',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        }
      }}
    />
  );
}
