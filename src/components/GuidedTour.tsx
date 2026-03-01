import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';

interface GuidedTourProps {
  run: boolean;
  setRun: (run: boolean) => void;
  userRole: string;
}

export default function GuidedTour({ run, setRun, userRole }: GuidedTourProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(0);

  const isAdmin = userRole === 'Administrator' || userRole === 'System Administrator';
  const isSenior = isAdmin || userRole === 'Senior Field Engineer';

  const steps: Step[] = [
    {
      target: 'body',
      content: 'Welcome to the system! Let us take a quick tour to show you how to navigate around.',
      placement: 'center',
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
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;
    
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRun(false);
      setStepIndex(0);
      const userStr = localStorage.getItem('iictd_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        localStorage.setItem(`iictd_tour_seen_${user.id}`, 'true');
      }
      return;
    }

    if (type === 'step:after' && action === 'next') {
      setStepIndex(index + 1);
    } else if (type === 'step:after' && action === 'prev') {
      setStepIndex(index - 1);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#2563eb',
          backgroundColor: '#0f172a',
          textColor: '#f8fafc',
          arrowColor: '#0f172a',
          zIndex: 10000,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#2563eb',
        },
        buttonBack: {
          color: '#94a3b8',
        }
      }}
    />
  );
}
