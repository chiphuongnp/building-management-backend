import { RankDiscount, UserRank } from '../constants/enum';
import { POINTS_EARN_RATE, POINT_EXCHANGE_VALUE } from '../constants/constant';

export const calculatePayment = (amount: number, rank = UserRank.BRONZE, pointsUsed = 0) => {
  const rankKey = rank.toUpperCase() as keyof typeof RankDiscount;
  const discount = (amount * RankDiscount[rankKey]) / 100;
  const maxPointsUsed = Math.ceil((amount - discount) / POINT_EXCHANGE_VALUE);
  const finalPointsUsed = Math.min(pointsUsed, maxPointsUsed);
  const finalAmount = Math.max(0, amount - discount - finalPointsUsed * POINT_EXCHANGE_VALUE);
  const pointsEarned = Math.floor(finalAmount / POINTS_EARN_RATE);

  return { finalAmount, discount, pointsEarned, finalPointsUsed };
};
