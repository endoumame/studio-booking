# リハーサルスタジオ予約システム 仕様書

> Claude Code 実装依頼用ドキュメント
> モデリング手法: SUDO モデリング（S/U/D/O）
> 設計方針: ドメイン駆動設計（DDD）+ イベントソーシング + CQRS

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [システム関連図 (S)](#2-システム関連図-s)
3. [ユースケース一覧 (U)](#3-ユースケース一覧-u)
4. [ドメインモデル (D)](#4-ドメインモデル-d)
5. [オブジェクトシナリオ (O)](#5-オブジェクトシナリオ-o)
6. [ビジネスルール](#6-ビジネスルール)
7. [状態遷移定義](#7-状態遷移定義)
8. [外部システム連携](#8-外部システム連携)
9. [推奨アーキテクチャ・技術スタック](#9-推奨アーキテクチャ技術スタック)
10. [実装優先順位](#10-実装優先順位)

---

## 1. プロジェクト概要

### 目的

リハーサルスタジオの予約・管理を行う Web アプリケーションを構築する。
バンドメンバーが空き枠を検索し、オンラインまたは現地で支払いを行い、スタジオを利用できる仕組みを提供する。

### ドメインの複雑さ

本システムは以下の技術的挑戦を含む:

- **集約・整合性境界の設計**: 部屋・時間帯の二重予約防止
- **イベントソーシング**: 予約状態変化の完全な履歴追跡
- **CQRS**: 空き枠検索（Read）と予約確定（Write）の分離
- **複雑な状態遷移**: 予約ライフサイクルの 7 状態管理

---

## 2. システム関連図 (S)

### アクター

| アクター | 役割 |
|---|---|
| バンドメンバー | 予約の作成・変更・キャンセル・履歴確認を行う主要ユーザー |
| スタジオスタッフ | チェックイン処理・延長承認・利用状況確認を担当 |
| オーナー/管理者 | スタジオ設定・料金管理・レポート閲覧を担当 |

### 外部システム

| システム | 役割 | 接続方向 |
|---|---|---|
| 決済システム (Stripe) | オンライン決済・返金処理 | システム → Stripe |
| メール/SMS通知 (SendGrid等) | 予約確認・変更・キャンセルメール送信 | システム → SendGrid |
| カレンダー連携 (Google Calendar) | 予約イベントの同期 | システム → GCal |
| Push 通知 | リマインダー送信 | システム → Push |
| チャットツール (LINE / Slack 等) | バンド内の調整（**システム外**） | 参照のみ |

> **注意**: バンドメンバー間の承認・調整はチャットツール上で完結し、本システムは関与しない。

---

## 3. ユースケース一覧 (U)

### 3-1. バンドメンバー

| # | ユースケース | 説明 | 関係 |
|---|---|---|---|
| UC-M01 | 空き枠を検索する | 日時・部屋条件で空き枠を検索する | - |
| UC-M02 | 予約を作成する | 空き枠を選択し予約を確定する | `<<include>>` UC-M04 |
| UC-M03 | 機材を追加する | 予約作成時にオプション機材を追加する | `<<extend>>` UC-M02 |
| UC-M04 | 支払いを行う | オンラインまたは現地精算で支払う | UC-M02 / UC-M06 から include |
| UC-M05 | 予約を変更する | 日時・部屋・機材を変更する | - |
| UC-M06 | 予約をキャンセルする | キャンセルポリシーに基づき返金処理を行う | `<<include>>` UC-M04（返金） |
| UC-M07 | 延長をリクエストする | 利用中に追加時間を申請する | - |
| UC-M08 | 予約履歴を確認する | 過去・未来の予約一覧を確認する | - |

### 3-2. スタジオスタッフ

| # | ユースケース | 説明 |
|---|---|---|
| UC-S01 | チェックインを処理する | 来客を確認し予約をチェックイン状態に遷移する |
| UC-S02 | 延長リクエストを承認する | バンドメンバーからの延長申請を承認または却下する（手動のみ・自動承認なし） |
| UC-S03 | 利用状況を確認する | 当日の全部屋の利用状況をリアルタイムで確認する |

### 3-3. オーナー/管理者

| # | ユースケース | 説明 |
|---|---|---|
| UC-O01 | スタジオ・部屋を設定する | スタジオ情報・部屋情報を登録・編集する |
| UC-O02 | 料金・プランを設定する | 時間帯別・部屋別の料金を設定する |
| UC-O03 | キャンセルポリシーを設定する | 返金ルール（日数・割合）を設定する |
| UC-O04 | 機材マスタを管理する | レンタル機材の登録・編集・削除を行う |
| UC-O05 | 稼働レポートを閲覧する | 部屋稼働率・売上・利用傾向を閲覧する |

---

## 4. ドメインモデル (D)

### 4-1. 集約一覧

| 集約ルート | 説明 | 整合性境界 |
|---|---|---|
| **Booking** ★ | 予約（中心集約） | 予約単位で強整合性を保証 |
| Studio | スタジオ（部屋・ポリシーを含む） | スタジオ単位 |
| Member | メンバー（会員カードを含む） | メンバー単位 |
| Band | バンド（任意） | バンド単位 |

### 4-2. エンティティ定義

#### Studio（スタジオ）

```
Studio {
  studioId : StudioId          // 識別子
  name     : String            // スタジオ名
  address  : Address           // 住所（Value Object）
  rooms    : Room[]            // 部屋一覧（1対多）
  cancellationPolicy : CancellationPolicy  // キャンセルポリシー（1対1）
}
```

#### Room（部屋）

```
Room {
  roomId      : RoomId    // 識別子
  name        : String    // 部屋名（例: "Aスタジオ 第1室"）
  capacity    : Int       // 最大収容人数
  hourlyRate  : Money     // 1時間あたりの料金（Value Object）
  equipment   : Equipment[]  // 備え付け機材（1対多）
}
```

#### Equipment（機材）

```
Equipment {
  equipmentId : EquipmentId  // 識別子
  name        : String       // 機材名（例: "ドラムセット"）
  rentalFee   : Money        // レンタル料（Value Object）
}
```

#### CancellationPolicy（キャンセルポリシー）

```
CancellationPolicy {
  policyId : PolicyId           // 識別子
  rules    : CancellationRule[] // キャンセルルール一覧（Value Object[]）
}
```

#### Member（メンバー）

```
Member {
  memberId : MemberId  // 識別子
  name     : String    // 氏名
  email    : Email     // メールアドレス（Value Object）
  card     : MemberCard  // 会員カード（1対1、初回利用時に発行）
}
```

#### MemberCard（会員カード）

```
MemberCard {
  cardId     : CardId    // 識別子
  cardNumber : String    // カード番号
  points     : Point     // 保有ポイント（Value Object）
  issuedAt   : DateTime  // 発行日時（初回スタジオ利用時）
}
```

#### Band（バンド）※任意

```
Band {
  bandId  : BandId    // 識別子
  name    : String    // バンド名
  members : Member[]  // 所属メンバー（多対多）
}
```

#### Booking（予約）★ 中心集約

```
Booking {
  bookingId        : BookingId          // 識別子
  status           : BookingStatus      // 予約状態（列挙型）
  timeSlot         : TimeSlot           // 時間枠（Value Object）
  totalAmount      : Money              // 合計金額（Value Object）
  createdAt        : DateTime           // 作成日時
  member           : MemberId           // 予約者（必須）
  band             : BandId?            // バンド（任意 0..1）
  room             : RoomId             // 予約部屋（必須）
  addedEquipment   : EquipmentId[]      // 追加機材（多対多）
  payment          : Payment            // 支払い情報（1対1）
  extensionRequest : ExtensionRequest?  // 延長リクエスト（任意 0..1）
}
```

#### Payment（支払い）

```
Payment {
  paymentId   : PaymentId      // 識別子
  amount      : Money          // 支払い金額（ポイント割引後）
  method      : PaymentMethod  // 支払い方法（列挙型）
  pointsUsed  : Point          // 使用ポイント（Value Object）
  status      : PaymentStatus  // 支払い状態（列挙型）
  paidAt      : DateTime?      // 支払い完了日時（現地精算は利用後）
}
```

#### ExtensionRequest（延長リクエスト）

```
ExtensionRequest {
  requestId    : RequestId       // 識別子
  extraMinutes : Int             // 延長時間（分）
  status       : ExtensionStatus // 延長状態（列挙型）
  requestedAt  : DateTime        // リクエスト日時
}
```

### 4-3. 値オブジェクト定義

| 値オブジェクト | フィールド | 制約・説明 |
|---|---|---|
| `TimeSlot` | `startTime: DateTime`, `endTime: DateTime` | `startTime < endTime` を保証。重複チェックロジックを持つ |
| `Money` | `amount: Int`, `currency: String` | 負数不可。通貨は JPY 固定 |
| `Point` | `value: Int` | 1P = 1円。負数不可 |
| `Email` | `value: String` | RFC 5321 準拠のフォーマット検証 |
| `Address` | `prefecture`, `city`, `street`, `zipCode` | - |
| `CancellationRule` | `daysBeforeBooking: Int`, `refundRate: Percentage` | 例: 7日前まで100%返金 |
| `Percentage` | `value: Int` | 0〜100 の範囲 |

### 4-4. 列挙型定義

#### BookingStatus（予約状態）

```
TENTATIVE        // 仮押さえ（TTL付き、有効期限切れで自動キャンセル）
AWAITING_PAYMENT // 支払い待ち
CONFIRMED        // 予約確定
CHECKED_IN       // チェックイン済み
IN_USE           // 利用中
COMPLETED        // 利用完了
CANCELLED        // キャンセル済み
```

#### PaymentMethod（支払い方法）

```
ONLINE_CREDIT_CARD  // オンラインクレジットカード
ON_SITE_CASH        // 現地現金払い
ON_SITE_CARD        // 現地カード払い
```

#### PaymentStatus（支払い状態）

```
PENDING    // 未払い（現地精算待ち）
COMPLETED  // 支払い完了
REFUNDED   // 返金済み
PARTIAL_REFUNDED  // 一部返金済み
```

#### ExtensionStatus（延長状態）

```
PENDING   // 申請中（スタッフ確認待ち）
APPROVED  // 承認済み
REJECTED  // 却下
```

### 4-5. リレーション一覧

```
Studio       ──1対1──  CancellationPolicy
Studio       ──1対多── Room
Room         ──1対多── Equipment
Member       ──1対1──  MemberCard
Band         ──多対多── Member
Booking      ──多対1──  Member（予約者）
Booking      ──多対0..1── Band（任意）
Booking      ──多対1──  Room
Booking      ──多対多── Equipment（追加機材）
Booking      ──1対1──  TimeSlot（VO）
Booking      ──1対1──  Payment
Booking      ──1対0..1── ExtensionRequest
```

---

## 5. オブジェクトシナリオ (O)

### シナリオ 1: バンドあり・機材追加・オンライン決済（ポイント割引）

```
tanaka : Member
  memberId = "M-001"
  name     = "田中 太郎"
  email    = "tanaka@example.com"

tanaka_card : MemberCard
  cardId     = "C-001"
  cardNumber = "MC-0001"
  points     = Point(100)      // 500P 使用後の残高
  issuedAt   = 2025-04-01

thunder_cats : Band
  bandId = "B-001"
  name   = "Thunder Cats"

room_a1 : Room
  roomId     = "R-001"
  name       = "Aスタジオ 第1室"
  capacity   = 6
  hourlyRate = Money(1500)

drum_set : Equipment
  equipmentId = "E-001"
  name        = "ドラムセット"
  rentalFee   = Money(500)

slot1 : TimeSlot
  startTime = 2026-05-10T14:00
  endTime   = 2026-05-10T17:00   // 3時間

booking1 : Booking
  bookingId   = "BK-001"
  status      = CONFIRMED
  totalAmount = Money(5000)      // 1500×3h + 500 = 5000
  member      = tanaka
  band        = thunder_cats
  room        = room_a1
  timeSlot    = slot1
  addedEquipment = [drum_set]

payment1 : Payment
  paymentId  = "P-001"
  amount     = Money(4500)       // 5000 - 500P割引 = 4500
  method     = ONLINE_CREDIT_CARD
  pointsUsed = Point(500)
  status     = COMPLETED
  paidAt     = 2026-04-20T10:30
```

### シナリオ 2: バンドなし（音合わせ）・現地精算・初回利用（カード発行）

```
suzuki : Member
  memberId = "M-002"
  name     = "鈴木 花子"
  email    = "suzuki@example.com"

suzuki_card : MemberCard  // 本予約の利用時に発行
  cardId     = "C-002"
  cardNumber = "MC-0002"
  points     = Point(0)         // 初回発行のためポイントなし
  issuedAt   = 2026-05-15

room_b2 : Room
  roomId     = "R-003"
  name       = "Bスタジオ 第2室"
  capacity   = 4
  hourlyRate = Money(2000)

slot2 : TimeSlot
  startTime = 2026-05-15T10:00
  endTime   = 2026-05-15T12:00   // 2時間

booking2 : Booking
  bookingId   = "BK-002"
  status      = CONFIRMED
  totalAmount = Money(4000)      // 2000×2h = 4000
  member      = suzuki
  band        = null             // バンドなし（音合わせ）
  room        = room_b2
  timeSlot    = slot2
  addedEquipment = []

payment2 : Payment
  paymentId  = "P-002"
  amount     = Money(4000)
  method     = ON_SITE_CASH
  pointsUsed = Point(0)
  status     = AWAITING          // 当日現地精算待ち
  paidAt     = null
```

### シナリオ 3: 確定済み予約 → 延長リクエスト → スタッフ承認（IN_USE 中）

```
yamada : Member
  memberId = "M-003"
  name     = "山田 次郎"
  email    = "yamada@example.com"

yamada_card : MemberCard
  cardId     = "C-003"
  cardNumber = "MC-0003"
  points     = Point(200)
  issuedAt   = 2025-10-01

rock_circle : Band
  bandId = "B-002"
  name   = "Rock Circle"

room_c1 : Room
  roomId     = "R-005"
  name       = "Cスタジオ 第1室"
  capacity   = 8
  hourlyRate = Money(2000)

slot3 : TimeSlot
  startTime = 2026-05-20T18:00
  endTime   = 2026-05-20T21:00   // 3時間

booking3 : Booking
  bookingId   = "BK-003"
  status      = IN_USE           // 利用中に延長申請
  totalAmount = Money(7000)      // 6000 + 延長30分1000 = 7000
  member      = yamada
  band        = rock_circle
  room        = room_c1
  timeSlot    = slot3

ext_req1 : ExtensionRequest     // 利用中に申請→スタッフが承認
  requestId    = "EX-001"
  extraMinutes = 30
  status       = APPROVED
  requestedAt  = 2026-05-20T20:30

payment3 : Payment
  paymentId  = "P-003"
  amount     = Money(7000)       // 延長分込みで再計算
  method     = ONLINE_CREDIT_CARD
  pointsUsed = Point(0)
  status     = AWAITING          // 延長承認後に支払い確定
```

---

## 6. ビジネスルール

### 6-1. 予約ルール

| # | ルール |
|---|---|
| BR-01 | 同一部屋・同一時間帯への二重予約を禁止する（`TimeSlot` の重複チェック） |
| BR-02 | 仮押さえ（TENTATIVE）には TTL を設定し、期限切れで自動的に CANCELLED へ遷移する |
| BR-03 | バンド登録は任意。バンド未結成のメンバーが個人で予約可能 |
| BR-04 | 予約変更は CONFIRMED 状態のみ可能。CHECKED_IN 以降は変更不可 |
| BR-05 | 予約キャンセルは COMPLETED / IN_USE 状態では不可 |

### 6-2. 会員カードルール

| # | ルール |
|---|---|
| BR-10 | MemberCard は 1 メンバーにつき 1 枚のみ発行される |
| BR-11 | MemberCard は初めてスタジオを利用する際（初回チェックイン時）に必ず発行される |
| BR-12 | ポイントは 1P = 1円で支払い金額から割引される |
| BR-13 | ポイント使用は支払い時のみ。後からの遡及適用は不可 |
| BR-14 | ポイントは予約完了時（COMPLETED 遷移時）に付与される。付与率は別途設定 |

### 6-3. 支払いルール

| # | ルール |
|---|---|
| BR-20 | 1 予約につき Payment は 1 つのみ |
| BR-21 | 支払い方法は `ONLINE_CREDIT_CARD` / `ON_SITE_CASH` / `ON_SITE_CARD` の 3 種類 |
| BR-22 | オンライン決済（`ONLINE_CREDIT_CARD`）は予約確定時に処理する |
| BR-23 | 現地精算（`ON_SITE_CASH` / `ON_SITE_CARD`）は `status = AWAITING` で作成し、精算完了後に `COMPLETED` へ遷移する |
| BR-24 | 延長承認後、totalAmount を再計算し Payment の amount を更新する |

### 6-4. キャンセルポリシールール

| # | ルール |
|---|---|
| BR-30 | キャンセル時の返金額は `CancellationPolicy` の `CancellationRule[]` に基づき計算する |
| BR-31 | `CancellationRule` は `daysBeforeBooking`（日数）と `refundRate`（返金率 0〜100%）で構成される |
| BR-32 | 複数ルールが定義された場合、キャンセル日時から最も近い `daysBeforeBooking` のルールを適用する |
| BR-33 | 返金は元の支払い方法に応じて処理する（オンライン: Stripe 経由、現地: 現金/手動） |
| BR-34 | ポイント払い分の返金はポイントに戻す（現金返金は不可） |

### 6-5. 延長ルール

| # | ルール |
|---|---|
| BR-40 | 延長リクエストは 1 予約につき 1 回のみ |
| BR-41 | 延長承認はスタジオスタッフのみが行う（自動承認なし） |
| BR-42 | 延長可否はスタッフが次の予約状況を確認したうえで判断する（システムは情報提供のみ） |
| BR-43 | 延長承認後、`Booking.timeSlot.endTime` を更新し、`totalAmount` を再計算する |

---

## 7. 状態遷移定義

### 7-1. BookingStatus 遷移図

```
[作成]
  └─→ TENTATIVE（仮押さえ）
        ├─→ AWAITING_PAYMENT（支払い待ち）  ← オンライン決済選択時
        │     └─→ CONFIRMED（確定）         ← 決済完了
        ├─→ CONFIRMED（確定）               ← 現地精算選択時（即確定）
        └─→ CANCELLED                       ← TTL 切れ or 手動キャンセル

CONFIRMED
  ├─→ CANCELLED                             ← キャンセルポリシーに基づき返金
  └─→ CHECKED_IN                            ← スタッフがチェックイン処理

CHECKED_IN
  └─→ IN_USE                                ← 利用開始（自動 or スタッフ操作）

IN_USE
  └─→ COMPLETED                             ← 利用終了・精算完了
        └─ ポイント付与処理 ─┘

※ COMPLETED / CANCELLED は終端状態（それ以上遷移しない）
```

### 7-2. ExtensionStatus 遷移図

```
[IN_USE 中に申請]
  └─→ PENDING（申請中）
        ├─→ APPROVED（承認）  ← スタッフ操作 → Booking.timeSlot / totalAmount 更新
        └─→ REJECTED（却下）  ← スタッフ操作
```

### 7-3. PaymentStatus 遷移図

```
（オンライン）
  PENDING → COMPLETED
  COMPLETED → REFUNDED / PARTIAL_REFUNDED  ← キャンセル時

（現地精算）
  AWAITING → COMPLETED  ← スタッフが精算完了操作
  AWAITING → REFUNDED   ← キャンセル時（現地返金）
```

---

## 8. 外部システム連携

### 8-1. 決済システム (Stripe)

| タイミング | 処理 |
|---|---|
| `AWAITING_PAYMENT → CONFIRMED` | Stripe PaymentIntent 確定 |
| `CONFIRMED → CANCELLED` | Stripe Refund 作成（返金率に応じた金額） |
| 延長承認後 | 差額の追加請求（Stripe PaymentIntent 追加） |

### 8-2. メール/SMS 通知 (SendGrid 等)

| イベント | 通知内容 |
|---|---|
| 予約確定（CONFIRMED） | 予約確認メール（日時・部屋・金額） |
| 予約変更 | 変更内容の通知 |
| キャンセル | キャンセル確認・返金額の通知 |
| 前日リマインダー | 予約日時・場所のリマインド |
| 延長承認/却下 | 延長結果の通知 |
| チェックイン | チェックイン完了通知 |

### 8-3. カレンダー連携 (Google Calendar)

| タイミング | 処理 |
|---|---|
| 予約確定 | カレンダーイベント作成 |
| 予約変更 | イベント更新 |
| キャンセル | イベント削除 |

---

## 9. 推奨アーキテクチャ・技術スタック

### 9-1. アーキテクチャ方針

```
Onion Architecture（ヘキサゴナル）

┌──────────────────────────────────┐
│  Infrastructure Layer             │
│  (DB, Stripe, SendGrid, GCal)    │
│  ┌────────────────────────────┐  │
│  │  Application Layer         │  │
│  │  (UseCases, CQRS Handlers) │  │
│  │  ┌──────────────────────┐  │  │
│  │  │  Domain Layer        │  │  │
│  │  │  (Aggregates, VO,    │  │  │
│  │  │   Domain Events)     │  │  │
│  │  └──────────────────────┘  │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
         ↑ Presentation Layer
    (REST API / GraphQL)
```

### 9-2. 技術スタック（推奨）

| レイヤー | 技術 | 理由 |
|---|---|---|
| バックエンド | Hono + TypeScript | 軽量・型安全・Cloudflare Workers 対応 |
| データベース（Write） | Cloudflare D1（SQLite） | イベントストアとして使用 |
| データベース（Read） | Cloudflare D1（読み取りビュー） | CQRS Read モデル |
| ランタイム | Cloudflare Workers | サーバーレス |
| フロントエンド | Vue 3 + TypeScript | - |
| 決済 | Stripe | - |
| メール通知 | SendGrid または Resend | - |

### 9-3. ディレクトリ構成（推奨）

```
src/
  domain/
    booking/
      Booking.ts            // 集約ルート
      BookingStatus.ts      // 列挙型
      BookingEvents.ts      // ドメインイベント定義
      TimeSlot.ts           // 値オブジェクト
      ExtensionRequest.ts   // エンティティ
    payment/
      Payment.ts
      PaymentMethod.ts
      Money.ts              // 値オブジェクト
      Point.ts              // 値オブジェクト
    member/
      Member.ts
      MemberCard.ts
      Email.ts              // 値オブジェクト
    studio/
      Studio.ts
      Room.ts
      Equipment.ts
      CancellationPolicy.ts
      CancellationRule.ts   // 値オブジェクト
    band/
      Band.ts
  application/
    commands/               // Write側: ユースケース（コマンド）
      CreateBookingCommand.ts
      CancelBookingCommand.ts
      CheckInCommand.ts
      ApproveExtensionCommand.ts
      ...
    queries/                // Read側: クエリ
      SearchAvailableSlotsQuery.ts
      GetBookingHistoryQuery.ts
      GetRoomStatusQuery.ts
      ...
  infrastructure/
    repositories/
      BookingRepository.ts
      MemberRepository.ts
      StudioRepository.ts
    eventStore/
      EventStore.ts
    adapters/
      StripeAdapter.ts
      SendGridAdapter.ts
      GoogleCalendarAdapter.ts
  presentation/
    api/
      bookingRouter.ts
      memberRouter.ts
      staffRouter.ts
      adminRouter.ts
```

### 9-4. イベントストア設計

```sql
-- events テーブル（イベントソーシング用）
CREATE TABLE events (
  id          TEXT PRIMARY KEY,
  stream_id   TEXT NOT NULL,        -- 集約ID（例: bookingId）
  stream_type TEXT NOT NULL,        -- 集約種別（例: "Booking"）
  event_type  TEXT NOT NULL,        -- イベント種別（例: "BookingConfirmed"）
  payload     TEXT NOT NULL,        -- JSON シリアライズされたイベントデータ
  version     INTEGER NOT NULL,     -- 楽観的ロック用バージョン
  occurred_at TEXT NOT NULL,        -- 発生日時 (ISO 8601)
  UNIQUE(stream_id, version)
);

-- read_bookings テーブル（CQRS Read モデル）
CREATE TABLE read_bookings (
  booking_id    TEXT PRIMARY KEY,
  member_id     TEXT NOT NULL,
  band_id       TEXT,
  room_id       TEXT NOT NULL,
  status        TEXT NOT NULL,
  start_time    TEXT NOT NULL,
  end_time      TEXT NOT NULL,
  total_amount  INTEGER NOT NULL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
```

### 9-5. ドメインイベント一覧

| イベント | トリガー |
|---|---|
| `BookingCreated` | 仮押さえ作成 |
| `BookingPaymentRequested` | 支払い待ち遷移 |
| `BookingConfirmed` | 予約確定 |
| `BookingCheckedIn` | チェックイン |
| `BookingInUse` | 利用開始 |
| `BookingCompleted` | 利用完了 |
| `BookingCancelled` | キャンセル |
| `BookingEquipmentAdded` | 機材追加 |
| `BookingTimeSlotChanged` | 時間枠変更 |
| `ExtensionRequested` | 延長申請 |
| `ExtensionApproved` | 延長承認 |
| `ExtensionRejected` | 延長却下 |
| `PaymentCompleted` | 支払い完了 |
| `PaymentRefunded` | 返金完了 |
| `MemberCardIssued` | 会員カード発行 |
| `PointsEarned` | ポイント付与 |
| `PointsUsed` | ポイント使用 |

---

## 10. 実装優先順位

### Phase 1（MVP）

1. Member の登録・認証
2. Studio / Room / Equipment のマスタ管理
3. 空き枠検索（Read モデル）
4. 予約作成（現地精算のみ）・キャンセル
5. チェックイン処理
6. 予約履歴確認

### Phase 2

7. オンライン決済（Stripe 連携）
8. 会員カード・ポイント機能
9. キャンセルポリシー・返金処理
10. 機材追加オプション

### Phase 3

11. 延長リクエスト・スタッフ承認
12. メール/SMS 通知
13. カレンダー連携
14. 稼働レポート（管理者向け）
15. イベントソーシング完全移行

---

## 付録: 用語集

| 用語 | 説明 |
|---|---|
| Booking | 予約。本システムの中心集約 |
| TimeSlot | 開始・終了時刻を持つ時間枠。値オブジェクト |
| MemberCard | メンバーに 1 枚発行される会員カード。ポイントを管理 |
| Point | 1P = 1円のポイント。支払い時に割引として使用可能 |
| CancellationPolicy | キャンセル時の返金ルールを定義するポリシー |
| ExtensionRequest | 利用中に発生する延長申請。1予約1回まで |
| CQRS | コマンドクエリ責務分離。書き込みと読み取りのモデルを分離 |
| Event Sourcing | 状態変化をイベントとして記録し、イベントから状態を再構築する手法 |
| Aggregate | 整合性境界をもつエンティティの集まり。集約ルートを通じてのみ操作する |
| Value Object | 同値性を値で判断するオブジェクト。不変 |
