/* eslint-disable import/prefer-default-export */
import React, { useContext, useMemo } from 'react';
import { AppContext } from '@edx/frontend-platform/react';
import { ALERT_TYPES, useAlert } from '../../generic/user-messages';
import { useModel } from '../../generic/model-store';

const PrivateCourseAlert = React.lazy(() => import('./PrivateCourseAlert'));

export function usePrivateCourseAlert(courseId) {
  const { authenticatedUser } = useContext(AppContext);
  const course = useModel('courses', courseId);
  const outline = useModel('outline', courseId);
  const privateOutline = outline && outline.courseBlocks && !outline.courses;
  const isVisible = course && course.isEnrolled !== undefined && !course.isEnrolled && privateOutline;
  const payload = {
    anonymousUser: authenticatedUser === null,
    canEnroll: outline ? outline.enrollAlert.canEnroll : false,
    courseId,
  };

  useAlert(isVisible, {
    code: 'clientPrivateCourseAlert',
    dismissible: false,
    payload: useMemo(() => payload, Object.values(payload).sort()),
    topic: 'outline-private-alerts',
    type: ALERT_TYPES.WELCOME,
  });

  return { clientPrivateCourseAlert: PrivateCourseAlert };
}
