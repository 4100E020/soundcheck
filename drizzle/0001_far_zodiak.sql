CREATE TABLE `chat_room_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chatRoomId` int NOT NULL,
	`userId` int NOT NULL,
	`unreadCount` int NOT NULL DEFAULT 0,
	`lastReadAt` timestamp,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_room_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `room_user_idx` UNIQUE(`chatRoomId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `chat_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('private','crew') NOT NULL,
	`crewId` int,
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crew_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`crewId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crew_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `crew_user_idx` UNIQUE(`crewId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `crews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`creatorId` int NOT NULL,
	`type` enum('transport','accommodation','onsite','ticket') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`details` json,
	`maxMembers` int NOT NULL,
	`currentMembers` int NOT NULL DEFAULT 1,
	`isFull` boolean NOT NULL DEFAULT false,
	`status` enum('open','full','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`coverImage` text,
	`eventType` enum('festival','concert','livehouse','other') NOT NULL,
	`venue` varchar(255),
	`address` text,
	`region` enum('north','central','south','east'),
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`lineup` json,
	`ticketUrl` text,
	`officialUrl` text,
	`participantCount` int NOT NULL DEFAULT 0,
	`vvipCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user1Id` int NOT NULL,
	`user2Id` int NOT NULL,
	`eventId` int,
	`matchScore` float,
	`status` enum('pending','matched','rejected') NOT NULL DEFAULT 'pending',
	`matchedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chatRoomId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`messageType` enum('text','image','song') NOT NULL DEFAULT 'text',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `music_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`topArtists` json,
	`topGenres` json,
	`audioFeatures` json,
	`musicVector` json,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `music_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `swipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetUserId` int NOT NULL,
	`eventId` int,
	`action` enum('like','pass') NOT NULL,
	`songId` varchar(255),
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `swipes_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_target_idx` UNIQUE(`userId`,`targetUserId`)
);
--> statement-breakpoint
CREATE TABLE `ticket_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventId` int NOT NULL,
	`ticketImage` text NOT NULL,
	`ticketNumber` varchar(255),
	`orderNumber` varchar(255),
	`status` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticket_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventId` int NOT NULL,
	`isVerified` boolean NOT NULL DEFAULT false,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_event_idx` UNIQUE(`userId`,`eventId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `nickname` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `age` int;--> statement-breakpoint
ALTER TABLE `users` ADD `gender` enum('male','female','other');--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `isVVIP` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `dailySwipeCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastSwipeReset` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` ADD `spotifyConnected` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `spotifyUserId` varchar(255);--> statement-breakpoint
CREATE INDEX `chatRoomId_idx` ON `chat_room_members` (`chatRoomId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `chat_room_members` (`userId`);--> statement-breakpoint
CREATE INDEX `crewId_idx` ON `chat_rooms` (`crewId`);--> statement-breakpoint
CREATE INDEX `crewId_idx` ON `crew_members` (`crewId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `crew_members` (`userId`);--> statement-breakpoint
CREATE INDEX `eventId_idx` ON `crews` (`eventId`);--> statement-breakpoint
CREATE INDEX `creatorId_idx` ON `crews` (`creatorId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `crews` (`type`);--> statement-breakpoint
CREATE INDEX `startDate_idx` ON `events` (`startDate`);--> statement-breakpoint
CREATE INDEX `region_idx` ON `events` (`region`);--> statement-breakpoint
CREATE INDEX `user1_idx` ON `matches` (`user1Id`);--> statement-breakpoint
CREATE INDEX `user2_idx` ON `matches` (`user2Id`);--> statement-breakpoint
CREATE INDEX `eventId_idx` ON `matches` (`eventId`);--> statement-breakpoint
CREATE INDEX `chatRoomId_idx` ON `messages` (`chatRoomId`);--> statement-breakpoint
CREATE INDEX `senderId_idx` ON `messages` (`senderId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `music_profiles` (`userId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `swipes` (`userId`);--> statement-breakpoint
CREATE INDEX `targetUserId_idx` ON `swipes` (`targetUserId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `ticket_verifications` (`userId`);--> statement-breakpoint
CREATE INDEX `eventId_idx` ON `ticket_verifications` (`eventId`);--> statement-breakpoint
CREATE INDEX `ticketNumber_idx` ON `ticket_verifications` (`ticketNumber`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `user_events` (`userId`);--> statement-breakpoint
CREATE INDEX `eventId_idx` ON `user_events` (`eventId`);