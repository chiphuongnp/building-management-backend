import cron from 'node-cron';
import { firebaseHelper, getNormalizedDate, logger } from '../utils/index';
import {
  Collection,
  CronSchedule,
  EventRegistrationsStatus,
  EventBookingStatus,
  Sites,
} from '../constants/enum';
import { EventBooking } from '../interfaces/eventBooking';
import { TIMEZONE } from '../constants/constant';
import { Timestamp } from 'firebase-admin/firestore';

const getPaths = (site: Sites) => {
  const eventBookingCollection = `${site}/${Collection.EVENT_BOOKINGS}`;
  const eventRegistrationCollection = `${site}/${Collection.EVENT_REGISTRATIONS}`;

  return { eventBookingCollection, eventRegistrationCollection };
};

const runEventExpiration = async (site: Sites) => {
  logger.info(`[EventCron] Starting expiration check for site ${site}...`);

  try {
    const now = getNormalizedDate();
    const { eventBookingCollection, eventRegistrationCollection } = getPaths(site);
    const eventBookings: EventBooking[] = await firebaseHelper.getDocsByFields(
      eventBookingCollection,
      [{ field: 'end_time', operator: '<=', value: Timestamp.fromDate(now) }],
    );
    if (!eventBookings.length) {
      logger.error(`[EventCron] No event bookings in site ${site}`);

      return;
    }

    await Promise.all(
      eventBookings.map(async (event: EventBooking) => {
        const eventId = event.id;
        logger.info(`[EventCron] Expired event booking ID= ${eventId}!`);

        const eventBooking = await firebaseHelper.updateDoc(eventBookingCollection, eventId, {
          status: EventBookingStatus.EXPIRED,
        });
        if (!eventBooking) {
          logger.error(`[EventCron] Failed to expire event booking ID ${eventId} `);

          return;
        }

        const eventRegistrations = await firebaseHelper.getDocByField(
          eventRegistrationCollection,
          'event_booking_id',
          eventId,
        );
        if (!eventRegistrations.length) {
          logger.info(`[EventCron] No registrations for event ID ${eventId} in site ${site}!`);

          return;
        }

        await Promise.all(
          eventRegistrations.map((register) => {
            const registerId = register.id;
            firebaseHelper
              .updateDoc(eventRegistrationCollection, registerId, {
                status: EventRegistrationsStatus.CLOSED,
              })
              .then(() => {
                logger.info(
                  `[EventCron] Expired event registrations ID ${registerId} in event ID ${eventId}!`,
                );
              })
              .catch((err) => {
                logger.error(
                  `[EventCron] Failed to expire event registrations ID ${registerId}: `,
                  err,
                );
              });
          }),
        );
      }),
    );
  } catch (error) {
    logger.error('[EventCron] CRITICAL ERROR:', error);
  }
};

export const startEventExpiration = (site: Sites) => {
  cron.schedule(CronSchedule.EVENT_EXPIRATION, () => runEventExpiration(site), {
    timezone: TIMEZONE,
  });
};
