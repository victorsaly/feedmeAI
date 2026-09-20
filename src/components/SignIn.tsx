import { useEffect, useState } from 'react'
import { UserCircle, SignOut } from '@phosphor-icons/react'
import { signIn, signOut, useSessionToken, whoAmI } from '@/lib/account'

/**
 * The header's account chip. "Sign in" when signed out; your name (fetched
 * once per token, since arcade-api only hands over an id here) with a way
 * to sign out otherwise. The shopping list lives under this account, so
 * this is also the thing that explains where "Saved" ends and "List"
 * begins persisting.
 */
export function SignIn() {
  const token = useSessionToken()
  const [name, setName] = useState<string>()

  useEffect(() => {
    if (!token) { setName(undefined); return }
    let live = true
    whoAmI(token).then((me) => { if (live && me) setName(me.name) })
    return () => { live = false }
  }, [token])

  if (!token) {
    return (
      <button type="button" className="btn btn-ghost signin-btn" onClick={signIn}>
        <UserCircle size={18} /> Sign in
      </button>
    )
  }

  return (
    <button type="button" className="btn btn-ghost signin-btn" onClick={signOut} title="Sign out">
      <UserCircle size={18} weight="fill" /> {name ?? 'Account'} <SignOut size={16} />
    </button>
  )
}
