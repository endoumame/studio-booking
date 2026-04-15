-- Event Sourcing: events table
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  stream_id TEXT NOT NULL,
  stream_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  version INTEGER NOT NULL,
  occurred_at TEXT NOT NULL,
  UNIQUE(stream_id, version)
);

CREATE INDEX idx_events_stream_id ON events(stream_id);
CREATE INDEX idx_events_stream_type ON events(stream_type);
CREATE INDEX idx_events_event_type ON events(event_type);

-- Read model: bookings
CREATE TABLE read_bookings (
  booking_id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  band_id TEXT,
  room_id TEXT NOT NULL,
  status TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  payment_method TEXT,
  payment_status TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_read_bookings_member_id ON read_bookings(member_id);
CREATE INDEX idx_read_bookings_room_id ON read_bookings(room_id);
CREATE INDEX idx_read_bookings_status ON read_bookings(status);
CREATE INDEX idx_read_bookings_start_time ON read_bookings(start_time);

-- Master: studios
CREATE TABLE studios (
  studio_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  prefecture TEXT NOT NULL,
  city TEXT NOT NULL,
  street TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  policy_id TEXT NOT NULL
);

-- Master: rooms
CREATE TABLE rooms (
  room_id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  hourly_rate INTEGER NOT NULL,
  FOREIGN KEY (studio_id) REFERENCES studios(studio_id)
);

CREATE INDEX idx_rooms_studio_id ON rooms(studio_id);

-- Master: equipment
CREATE TABLE equipment (
  equipment_id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  name TEXT NOT NULL,
  rental_fee INTEGER NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);

CREATE INDEX idx_equipment_room_id ON equipment(room_id);

-- Master: members
CREATE TABLE members (
  member_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

-- Master: member_cards
CREATE TABLE member_cards (
  card_id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL UNIQUE,
  card_number TEXT NOT NULL UNIQUE,
  points INTEGER NOT NULL DEFAULT 0,
  issued_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES members(member_id)
);

CREATE INDEX idx_member_cards_member_id ON member_cards(member_id);

-- Master: bands
CREATE TABLE bands (
  band_id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Master: band_members (join table)
CREATE TABLE band_members (
  band_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  PRIMARY KEY (band_id, member_id),
  FOREIGN KEY (band_id) REFERENCES bands(band_id),
  FOREIGN KEY (member_id) REFERENCES members(member_id)
);

CREATE INDEX idx_band_members_member_id ON band_members(member_id);

-- Cancellation policy rules
CREATE TABLE cancellation_rules (
  policy_id TEXT NOT NULL,
  days_before_booking INTEGER NOT NULL,
  refund_rate INTEGER NOT NULL,
  PRIMARY KEY (policy_id, days_before_booking)
);
