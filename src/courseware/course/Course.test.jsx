import React from 'react';
import { Factory } from 'rosie';
import {
  loadUnit, render, screen, waitFor, getByRole, initializeTestStore, fireEvent,
} from '../../setupTest';
import Course from './Course';
import { handleNextSectionCelebration } from './celebration';
import * as celebrationUtils from './celebration/utils';

jest.mock('@edx/frontend-platform/analytics');

const recordFirstSectionCelebration = jest.fn();
celebrationUtils.recordFirstSectionCelebration = recordFirstSectionCelebration;

describe('Course', () => {
  let store;
  const mockData = {
    nextSequenceHandler: () => {},
    previousSequenceHandler: () => {},
    unitNavigationHandler: () => {},
  };

  beforeAll(async () => {
    store = await initializeTestStore();
    const { courseware, models } = store.getState();
    const { courseId, sequenceId } = courseware;
    Object.assign(mockData, {
      courseId,
      sequenceId,
      unitId: Object.values(models.units)[0].id,
    });
  });

  it('loads learning sequence', async () => {
    render(<Course {...mockData} />);
    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();
    expect(screen.getByText('Loading learning sequence...')).toBeInTheDocument();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Learn About Verified Certificates' })).not.toBeInTheDocument();

    loadUnit();
    await waitFor(() => expect(screen.queryByText('Loading learning sequence...')).not.toBeInTheDocument());

    const { models } = store.getState();
    const sequence = models.sequences[mockData.sequenceId];
    const section = models.sections[sequence.sectionId];
    const course = models.courses[mockData.courseId];
    expect(document.title).toMatch(
      `${sequence.title} | ${section.title} | ${course.title} | edX`,
    );
  });

  it('displays celebration modal', async () => {
    // TODO: Remove these console mocks after merging https://github.com/edx/paragon/pull/526.
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const courseMetadata = Factory.build('courseMetadata', { celebrations: { firstSection: true } });
    const testStore = await initializeTestStore({ courseMetadata }, false);
    const { courseware, models } = testStore.getState();
    const { courseId, sequenceId } = courseware;
    const testData = {
      ...mockData,
      courseId,
      sequenceId,
      unitId: Object.values(models.units)[0].id,
    };
    // Set up LocalStorage for testing.
    handleNextSectionCelebration(sequenceId, sequenceId, testData.unitId);
    render(<Course {...testData} />, { store: testStore });

    const celebrationModal = screen.getByRole('dialog');
    expect(celebrationModal).toBeInTheDocument();
    expect(getByRole(celebrationModal, 'heading', { name: 'Congratulations!' })).toBeInTheDocument();
  });

  it('displays upgrade sock', async () => {
    const courseMetadata = Factory.build('courseMetadata', { can_show_upgrade_sock: true });
    const testStore = await initializeTestStore({ courseMetadata, excludeFetchSequence: true }, false);

    render(<Course {...mockData} courseId={courseMetadata.id} />, { store: testStore });
    expect(screen.getByRole('button', { name: 'Learn About Verified Certificates' })).toBeInTheDocument();
  });

  it('displays offer and expiration alert', async () => {
    const offerText = 'test-offer';
    const offerId = `${offerText}-id`;
    const offerHtml = `<div data-testid="${offerId}">${offerText}</div>`;

    const expirationText = 'test-expiration';
    const expirationId = `${expirationText}-id`;
    const expirationHtml = `<div data-testid="${expirationId}">${expirationText}</div>`;

    const courseMetadata = Factory.build('courseMetadata', {
      offer_html: offerHtml,
      course_expired_message: expirationHtml,
    });
    const testStore = await initializeTestStore({ courseMetadata, excludeFetchSequence: true }, false);
    render(<Course {...mockData} courseId={courseMetadata.id} />, { store: testStore });

    expect(await screen.findByTestId(offerId)).toHaveTextContent(offerText);
    expect(screen.getByTestId(expirationId)).toHaveTextContent(expirationText);
  });

  it('passes handlers to the sequence', async () => {
    const nextSequenceHandler = jest.fn();
    const previousSequenceHandler = jest.fn();
    const unitNavigationHandler = jest.fn();

    const courseMetadata = Factory.build('courseMetadata');
    const unitBlocks = Array.from({ length: 3 }).map(() => Factory.build(
      'block',
      { type: 'vertical' },
      { courseId: courseMetadata.id },
    ));
    const testStore = await initializeTestStore({ courseMetadata, unitBlocks }, false);
    const { courseware, models } = testStore.getState();
    const { courseId, sequenceId } = courseware;
    const testData = {
      ...mockData,
      courseId,
      sequenceId,
      unitId: Object.values(models.units)[1].id, // Corner cases are already covered in `Sequence` tests.
      nextSequenceHandler,
      previousSequenceHandler,
      unitNavigationHandler,
    };
    render(<Course {...testData} />, { store: testStore });

    loadUnit();
    await waitFor(() => expect(screen.queryByText('Loading learning sequence...')).not.toBeInTheDocument());
    screen.getAllByRole('button', { name: /previous/i }).forEach(button => fireEvent.click(button));
    screen.getAllByRole('button', { name: /next/i }).forEach(button => fireEvent.click(button));

    // We are in the middle of the sequence, so no
    expect(previousSequenceHandler).not.toHaveBeenCalled();
    expect(nextSequenceHandler).not.toHaveBeenCalled();
    expect(unitNavigationHandler).toHaveBeenCalledTimes(4);
  });
});
