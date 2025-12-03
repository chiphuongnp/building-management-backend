import { RankDiscount, RankMinimumSpending, UserRank, VATRate } from '../constants/enum';
import { POINTS_EARN_RATE, POINT_EXCHANGE_VALUE } from '../constants/constant';

export const calculatePayment = (
  amount: number,
  rank = UserRank.BRONZE,
  pointsUsed = 0,
  vatRate = VATRate.DEFAULT,
) => {
  const rankKey = rank.toUpperCase() as keyof typeof RankDiscount;
  const discount = (amount * RankDiscount[rankKey]) / 100;
  const maxPointsUsed = Math.ceil((amount - discount) / POINT_EXCHANGE_VALUE);
  const finalPointsUsed = Math.min(pointsUsed, maxPointsUsed);
  let finalAmount = Math.max(0, amount - discount - finalPointsUsed * POINT_EXCHANGE_VALUE);
  const vatCharge = calculatePercentage(finalAmount, vatRate);
  finalAmount = finalAmount + vatCharge;
  const pointsEarned = Math.floor(finalAmount / POINTS_EARN_RATE);

  return { finalAmount, discount, pointsEarned, finalPointsUsed, vatCharge };
};

export const getRankFromAmount = (amount: number) => {
  switch (true) {
    case amount > RankMinimumSpending.MIN_AMOUNT_PLATINUM:
      return UserRank.PLATINUM;
    case amount >= RankMinimumSpending.MIN_AMOUNT_GOLD &&
      amount <= RankMinimumSpending.MIN_AMOUNT_PLATINUM:
      return UserRank.GOLD;
    case amount >= RankMinimumSpending.MIN_AMOUNT_SILVER &&
      amount <= RankMinimumSpending.MIN_AMOUNT_GOLD:
      return UserRank.SILVER;
    default:
      return UserRank.BRONZE;
  }
};

export const calculatePercentage = (amount: number, percent: number): number => {
  return (amount * percent) / 100;
};
