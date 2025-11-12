import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { admin } from '../configs/firebase';
import { ParkingSpaceStatus, ParkingSubscriptionStatus } from '../constants/enum';

export const onParkingSubscriptionStatusUpdate = onDocumentUpdated(
  'parking_spaces/{spaceId}/parking_subscriptions/{subscriptionId}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const { subscriptionId, spaceId } = event.params;

    if (!before || !after || before.status === after.status) return;

    logger.info(
      `Parking subscription ${subscriptionId} changed: ${before.status} → ${after.status}`,
    );

    let newParkingSpaceStatus: ParkingSpaceStatus;
    switch (after.status) {
      case ParkingSubscriptionStatus.RESERVED:
        newParkingSpaceStatus = ParkingSpaceStatus.RESERVED;
        break;

      case ParkingSubscriptionStatus.EXPIRED:
      case ParkingSubscriptionStatus.CANCELLED:
        newParkingSpaceStatus = ParkingSpaceStatus.AVAILABLE;
        break;
      default:
        logger.warn(`Unknown status: ${after.status}`);
        return;
    }

    try {
      await admin
        .firestore()
        .collection('parking_spaces')
        .doc(spaceId)
        .update({ status: newParkingSpaceStatus });
      logger.info(`Updated parking space spaceId=${spaceId}, newStatus=${newParkingSpaceStatus}`);
    } catch (error) {
      logger.error(`Failed to update parking space ${spaceId}:`, error);
    }
  },
);
