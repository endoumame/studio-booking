import { err, ok } from "neverthrow";
import type { DomainError } from "./errors.js";
import type { Result } from "neverthrow";
import { validation } from "./errors.js";

const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60_000;

interface TimeSlot {
  readonly startTime: Date;
  readonly endTime: Date;
}

const createTimeSlot = (startTime: Date, endTime: Date): Result<TimeSlot, DomainError> => {
  if (startTime >= endTime) {
    return err(validation("startTime must be before endTime"));
  }
  return ok({ endTime, startTime });
};

const durationMinutes = (slot: TimeSlot): number =>
  (slot.endTime.getTime() - slot.startTime.getTime()) / MS_PER_MINUTE;

const durationHours = (slot: TimeSlot): number => durationMinutes(slot) / MINUTES_PER_HOUR;

const overlaps = (left: TimeSlot, right: TimeSlot): boolean =>
  left.startTime < right.endTime && right.startTime < left.endTime;

const extendByMinutes = (slot: TimeSlot, minutes: number): TimeSlot => ({
  endTime: new Date(slot.endTime.getTime() + minutes * MS_PER_MINUTE),
  startTime: slot.startTime,
});

const timeSlotEquals = (left: TimeSlot, right: TimeSlot): boolean =>
  left.startTime.getTime() === right.startTime.getTime() &&
  left.endTime.getTime() === right.endTime.getTime();

export {
  createTimeSlot,
  durationHours,
  durationMinutes,
  extendByMinutes,
  overlaps,
  timeSlotEquals,
};
export type { TimeSlot };
