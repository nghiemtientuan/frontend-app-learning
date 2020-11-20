/* eslint-disable import/prefer-default-export */
import React, {
  useContext, useState, useCallback, useMemo,
} from 'react';
import { AppContext } from '@edx/frontend-platform/react';

import { UserMessagesContext, ALERT_TYPES, useAlert } from '../../generic/user-messages';
import { useModel } from '../../generic/model-store';

import { postCourseEnrollment } from './data/api';

const EnrollmentAlert = React.lazy(() => import('./EnrollmentAlert'));

export function useEnrollmentAlert(courseId) {
  const { authenticatedUser } = useContext(AppContext);
  const course = useModel('courses', courseId);
  const outline = useModel('outline', courseId);
  const isVisible = course && course.isEnrolled !== undefined && !course.isEnrolled && authenticatedUser !== null;
  const payload = {
    canEnroll: outline ? outline.enrollAlert.canEnroll : false,
    courseId,
    extraText: outline ? outline.enrollAlert.extraText : '',
    isStaff: course.isStaff,
  };

  useAlert(isVisible, {
    code: 'clientEnrollmentAlert',
    payload: useMemo(() => payload, Object.values(payload).sort()),
    topic: 'outline',
  });

  return { clientEnrollmentAlert: EnrollmentAlert };
}

export function useEnrollClickHandler(courseIdMemo, successText) {
  const [loading, setLoading] = useState(false);
  const { addFlash } = useContext(UserMessagesContext);
  const enrollClickHandler = useCallback((courseId) => () => {
    setLoading(true);
    postCourseEnrollment(courseId).then(() => {
      addFlash({
        dismissible: true,
        flash: true,
        text: successText,
        type: ALERT_TYPES.SUCCESS,
        topic: 'course',
      });
      setLoading(false);
      global.location.reload();
    });
  }, [courseIdMemo]);

  return { enrollClickHandler, loading };
}
