const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60_000;

class TimeSlot {
  readonly startTime: Date;
  readonly endTime: Date;

  private constructor(startTime: Date, endTime: Date) {
    this.startTime = startTime;
    this.endTime = endTime;
  }

  static create(startTime: Date, endTime: Date): TimeSlot {
    if (startTime >= endTime) {
      throw new RangeError("startTime must be before endTime");
    }
    return new TimeSlot(startTime, endTime);
  }

  durationMinutes(): number {
    return (this.endTime.getTime() - this.startTime.getTime()) / MS_PER_MINUTE;
  }

  durationHours(): number {
    return this.durationMinutes() / MINUTES_PER_HOUR;
  }

  overlapsWith(other: TimeSlot): boolean {
    return this.startTime < other.endTime && other.startTime < this.endTime;
  }

  extendByMinutes(minutes: number): TimeSlot {
    const newEnd = new Date(this.endTime.getTime() + minutes * MS_PER_MINUTE);
    return TimeSlot.create(this.startTime, newEnd);
  }

  equals(other: TimeSlot): boolean {
    return (
      this.startTime.getTime() === other.startTime.getTime() &&
      this.endTime.getTime() === other.endTime.getTime()
    );
  }
}

export { TimeSlot };
