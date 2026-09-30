import JSZip from 'jszip';

export type Reaction = {
    reaction: string;
    actor: string;
};

export type Reply = {
    message: string;
    sender: string;
    timestamp: number;
};

export type MediaFile = {
    uri: string;
    creation_timestamp: number;
};

export type Share = {
    link?: string;
    share_text?: string;
};

export type Message = {
    sender_name: string;
    timestamp_ms: number;
    content?: string;
    type: 'Generic' | 'Share' | 'Call' | 'Subscribe';
    is_unsent: boolean;
    photos?: MediaFile[];
    videos?: MediaFile[];
    audio_files?: MediaFile[];
    sticker?: MediaFile;
    share?: Share;
    reactions?: Reaction[];
    reply?: Reply;
    call_duration?: number;
};

export type Chat = {
    id: string;
    title: string;
    participants: { name: string }[];
    messageFiles: JSZip.JSZipObject[];
    preview: string;
    lastMessageTimestamp: number;
    participantCount: number;
};
