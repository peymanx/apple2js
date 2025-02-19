import type { byte, memory, MemberOf, word } from '../types';
import type { GamepadConfiguration } from '../ui/types';
import { InfoChunk } from './woz';

export const SUPPORTED_SECTORS = [13, 16] as const;
export type SupportedSectors = MemberOf<typeof SUPPORTED_SECTORS>;

export const DRIVE_NUMBERS = [1, 2] as const;
export type DriveNumber = MemberOf<typeof DRIVE_NUMBERS>;

/**
 * Arguments for the disk format processors.
 */
export interface DiskOptions {
    name: string;
    side?: string | undefined;
    volume: byte;
    readOnly: boolean;
    data?: memory[][];
    rawData?: ArrayBuffer;
    blockVolume?: boolean;
}

/**
 * JSON file entry format
 */
export interface DiskDescriptor {
    name: string;
    disk?: number;
    filename: string;
    e?: boolean;
    category: string;
}

/**
 * JSON binary image (not used?)
 */
export interface JSONBinaryImage {
    type: 'binary';
    start: word;
    length: word;
    data: byte[];
    gamepad?: GamepadConfiguration;
}

/**
 * Information about a disk image not directly related to the
 * disk contents. For example, the name or even a scan of the
 * disk label are "metadata", but the volume number is not.
 */
export interface DiskMetadata {
    /** Displayed disk name */
    name: string;
    /** (Optional) Disk side (Front/Back, A/B) */
    side?: string | undefined;
}

/**
 * Return value from disk format processors. Describes raw disk
 * data which the DiskII card can process.
 */
export interface Disk {
    metadata: DiskMetadata;
    readOnly: boolean;
}

export const ENCODING_NIBBLE = 'nibble';
export const ENCODING_BITSTREAM = 'bitstream';
export const ENCODING_BLOCK = 'block';

export interface FloppyDisk extends Disk {
    tracks: memory[];
}

export interface NibbleDisk extends FloppyDisk {
    encoding: typeof ENCODING_NIBBLE;
    format: DiskFormat;
    volume: byte;
}

export interface WozDisk extends FloppyDisk {
    encoding: typeof ENCODING_BITSTREAM;
    trackMap: number[];
    rawTracks: Uint8Array[];
    info: InfoChunk | undefined;
}

export interface BlockDisk extends Disk {
    encoding: typeof ENCODING_BLOCK;
    blocks: Uint8Array[];
}

/**
 * File types supported by the disk format processors and
 * block devices.
 */

export const NIBBLE_FORMATS = [
    '2mg',
    'd13',
    'do',
    'dsk',
    'po',
    'nib',
    'woz'
] as const;

export const BLOCK_FORMATS = [
    '2mg',
    'hdv',
    'po',
] as const;

export const DISK_FORMATS = [...NIBBLE_FORMATS, ...BLOCK_FORMATS] as const;

export type NibbleFormat = MemberOf<typeof NIBBLE_FORMATS>;
export type BlockFormat = MemberOf<typeof BLOCK_FORMATS>;
export type DiskFormat = MemberOf<typeof DISK_FORMATS>;

/**
 * Base format for JSON defined disks
 */

export class JSONDiskBase {
    type: DiskFormat;
    name: string;
    disk?: string;
    category?: string;
    volume?: byte;
    readOnly?: boolean;
    gamepad?: GamepadConfiguration;
}

/**
 * JSON Disk format with base64 encoded tracks with sectors
 */

export interface Base64JSONDisk extends JSONDiskBase {
    type: Exclude<DiskFormat, 'nib'>;
    encoding: 'base64';
    data: string[][];
}

/**
 * JSON Disk format with base64 encoded nibblized tracks
 */

export interface Base64JSONNibbleDisk extends JSONDiskBase {
    type: 'nib';
    encoding: 'base64';
    data: string[];
}

/**
 * JSON Disk format with byte array tracks
 */

export interface BinaryJSONDisk extends JSONDiskBase {
    type: DiskFormat;
    encoding: 'binary';
    data: memory[][];
}

/**
 * General JSON Disk format
 */

export type JSONDisk = Base64JSONDisk | Base64JSONNibbleDisk | BinaryJSONDisk;

/**
 * Process Disk message payloads for worker
 */

export const PROCESS_BINARY = 'PROCESS_BINARY';
export const PROCESS_JSON_DISK = 'PROCESS_JSON_DISK';
export const PROCESS_JSON = 'PROCESS_JSON';

/** Binary disk file message */
export interface ProcessBinaryMessage {
    type: typeof PROCESS_BINARY;
    payload: {
        drive: DriveNumber;
        fmt: NibbleFormat;
        options: DiskOptions;
    };
}

/** Processed JSON file message (used for localStorage) */
export interface ProcessJsonDiskMessage {
    type: typeof PROCESS_JSON_DISK;
    payload: {
        drive: DriveNumber;
        jsonDisk: JSONDisk;
    };
}

/** Raw JSON file message */
export interface ProcessJsonMessage {
    type: typeof PROCESS_JSON;
    payload: {
        drive: DriveNumber;
        json: string;
    };
}

export type FormatWorkerMessage =
    ProcessBinaryMessage |
    ProcessJsonDiskMessage |
    ProcessJsonMessage;

/**
 * Format work result message type
 */

export const DISK_PROCESSED = 'DISK_PROCESSED';

export interface DiskProcessedResponse {
    type: typeof DISK_PROCESSED;
    payload: {
        drive: DriveNumber;
        disk: FloppyDisk | null;
    };
}

export type FormatWorkerResponse =
    DiskProcessedResponse;

export interface MassStorageData {
    metadata: DiskMetadata;
    ext: string;
    readOnly: boolean;
    volume?: byte;
    data: ArrayBuffer;
}

/**
 * Block device common interface
 */
export interface MassStorage<T> {
    setBinary(drive: number, name: string, ext: T, data: ArrayBuffer): boolean;
    getBinary(drive: number, ext?: T): MassStorageData | null;
}
