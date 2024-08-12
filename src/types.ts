import type * as core from '@actions/core';

export type Logger = Pick<typeof core, 'error' | 'warning' | 'info' | 'debug'>;
