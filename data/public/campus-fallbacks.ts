import { diningPreview, gymPreview } from '@/constants/preview-data';
import type { GymCapacitySnapshot, PublicDiningHall } from '@/types/app-data';

export const fallbackDiningHalls: PublicDiningHall[] = diningPreview.halls.map(
  ({ imageSource: _imageSource, ...hall }) => hall,
);

export const fallbackGymCapacities: GymCapacitySnapshot[] = gymPreview.capacities.map(
  (location) => ({
    ...location,
    capturedAt: new Date().toISOString(),
    isClosed: false,
    zones: location.zones ?? [],
    zoneName: location.zoneName,
  }),
);
