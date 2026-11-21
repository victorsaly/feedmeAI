import { useEffect, useState } from 'react'
import { UserCircle } from '@phosphor-icons/react'
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useIsMobile } from '@/hooks/use-mobile'
import { signIn, signOut, useSessionToken, whoAmI } from '@/lib/account'
import { keepLocally } from '@/lib/list'
import { COUNTRIES, loadCountry, saveCountry } from '@/lib/shopping'
import { DEVICE } from '@/lib/device'

/** The header's way in: a person icon, with your name beside it once signed in. */
export function AccountButton({ onOpen }: { onOpen: () => void }) {
  const token = useSessionToken()
  const name = useName(token)
  return (
    <button type="button" className="btn btn-ghost signin-btn" onClick={onOpen} aria-label={token ? `Account: ${name ?? 'signed in'}` : 'Account'}>
      <UserCircle size={22} weight={token ? 'fill' : 'regular'} />
      {token && name && <span className="signin-name">{name}</span>}
    </button>
  )
}

function useName(token: string | null) {
  const [name, setName] = useState<string>()
  useEffect(() => {
    if (!token) { setName(undefined); return }
    let live = true
    whoAmI(token).then((me) => { if (live && me) setName(me.name) })
    return () => { live = false }
  }, [token])
  return name
}

/*
 * Account: the one place for who you are and where you shop. Nothing in the
 * app needs an account to get dinner; signing in is what carries the list
 * and saved recipes to another device and unlocks shop prices. The country
 * is here rather than on the list because it is set once, not every shop.
 */
export function Account({ open, onClose }: { open: boolean; onClose: () => void }) {
  const isMobile = useIsMobile()
  const token = useSessionToken()
  const name = useName(token)
  const [country, setCountry] = useState(() => loadCountry() ?? 'gb')
  const onOpenChange = (o: boolean) => { if (!o) onClose() }

  const body = (
    <div className="account">
      {token ? (
        <div className="account-who">
          <UserCircle size={40} weight="fill" aria-hidden="true" />
          <div>
            <b>{name ?? 'Signed in'}</b>
            <span>Your list and saved recipes follow this account.</span>
          </div>
        </div>
      ) : (
        <>
          <p className="account-why">
            You don’t need an account to photograph, cook or keep a list on this {DEVICE}. Signing in carries your
            list and saved recipes to your other devices, and unlocks shop prices.
          </p>
          <button type="button" className="btn btn-primary btn-xl" onClick={signIn}>Continue with Google</button>
        </>
      )}

      <label className="account-row" htmlFor="account-country">
        <span>
          <b>Shop prices for</b>
          <span>Only the United Kingdom has been tested so far.</span>
        </span>
        <select
          id="account-country"
          className="account-select"
          value={country}
          onChange={(e) => { setCountry(e.target.value); saveCountry(e.target.value) }}
        >
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}{c.code !== 'gb' ? ' (untested)' : ''}</option>)}
        </select>
      </label>

      {token && (
        <button type="button" className="btn btn-quiet account-out" onClick={() => { keepLocally(); signOut(); onClose() }}>
          Sign out
        </button>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="sheet">
          <div className="sheet-scroll">
            <DrawerTitle className="sheet-title">Account</DrawerTitle>
            <DrawerDescription className="sr-only">Sign in, and choose where you shop.</DrawerDescription>
            {body}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sheet sheet-dialog account-dialog">
        <div className="sheet-scroll">
          <DialogTitle className="sheet-title">Account</DialogTitle>
          <DialogDescription className="sr-only">Sign in, and choose where you shop.</DialogDescription>
          {body}
        </div>
      </DialogContent>
    </Dialog>
  )
}
