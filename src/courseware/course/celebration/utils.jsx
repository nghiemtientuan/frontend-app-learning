import { sendTrackEvent } from '@edx/frontend-platform/analytics';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';

import { postFirstSectionCelebrationComplete } from './data/api';
import { clearLocalStorage, getLocalStorage, setLocalStorage } from '../../../data/localStorage';
import { updateModel } from '../../../generic/model-store';

const CELEBRATION_LOCAL_STORAGE_KEY = 'CelebrationModal.showOnSectionLoad';

// Records clicks through the end of a section, so that we can know whether we should celebrate when we finish loading
function handleNextSectionCelebration(sequenceId, nextSequenceId, nextUnitId) {
  setLocalStorage(CELEBRATION_LOCAL_STORAGE_KEY, {
    prevSequenceId: sequenceId,
    nextSequenceId,
    nextUnitId,
  });
}

function recordFirstSectionCelebration(org, courseId) {
  // Tell the LMS
  postFirstSectionCelebrationComplete(courseId);

  // Tell our analytics
  const { administrator } = getAuthenticatedUser();
  sendTrackEvent('edx.ui.lms.celebration.first_section.opened', {
    org_key: org,
    course_id: courseId, // should be courserun_key, but left as-is for historical reasons
    is_staff: administrator,
  });
}

// Looks at local storage to see whether we just came from the end of a section.
// Note! This does have side effects (will clear some local storage and may start an api call).
function shouldCelebrateOnSectionLoad(courseId, sequenceId, unitId, celebrateFirstSection, dispatch) {
  const celebrationIds = getLocalStorage(CELEBRATION_LOCAL_STORAGE_KEY);
  if (!celebrationIds) {
    return false;
  }

  const {
    prevSequenceId,
    nextSequenceId,
    nextUnitId,
  } = celebrationIds;
  const onTargetUnit = sequenceId === nextSequenceId && (!nextUnitId || unitId === nextUnitId);
  const shouldCelebrate = onTargetUnit && celebrateFirstSection;

  if (sequenceId !== prevSequenceId && !onTargetUnit) {
    // Don't clear until we move off of current/prev sequence
    clearLocalStorage(CELEBRATION_LOCAL_STORAGE_KEY);

    // Update our local copy of course data from LMS
    dispatch(updateModel({
      modelType: 'courses',
      model: {
        id: courseId,
        celebrations: {
          firstSection: false,
        },
      },
    }));
  }

  return shouldCelebrate;
}

export { handleNextSectionCelebration, recordFirstSectionCelebration, shouldCelebrateOnSectionLoad };
