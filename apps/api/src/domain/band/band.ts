import type { BandId, MemberId } from "@my-app/shared";

const MIN_NAME_LENGTH = 0;
const MEMBER_NOT_FOUND = -1;

class Band {
  readonly bandId: BandId;
  readonly name: string;
  private readonly _members: MemberId[];

  private constructor(bandId: BandId, name: string, members: MemberId[]) {
    this.bandId = bandId;
    this.name = name;
    this._members = members;
  }

  static create(bandId: BandId, name: string): Band {
    if (name.trim().length === MIN_NAME_LENGTH) {
      throw new Error("Band name must not be empty");
    }
    return new Band(bandId, name.trim(), []);
  }

  get members(): readonly MemberId[] {
    return [...this._members];
  }

  addMember(memberId: MemberId): Band {
    if (this.hasMember(memberId)) {
      throw new Error("Member is already in the band");
    }
    return new Band(this.bandId, this.name, [...this._members, memberId]);
  }

  removeMember(memberId: MemberId): Band {
    const index = this._members.indexOf(memberId);
    if (index === MEMBER_NOT_FOUND) {
      throw new Error("Member is not in the band");
    }
    const updated = this._members.filter((id) => id !== memberId);
    return new Band(this.bandId, this.name, updated);
  }

  hasMember(memberId: MemberId): boolean {
    return this._members.includes(memberId);
  }
}

export { Band };
