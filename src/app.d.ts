// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

import type { LoggedUser } from '$lib/utils'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'

declare global {
	namespace App {
		// interface Locals {}
		// interface PageData {}
		// interface Error {}
		// interface Platform {}
	}
}
