import OrganizerSignIn from '../auth/OrganizerSignIn'
import { useOrganizerSession } from '../auth/useOrganizerSession'
import Dashboard from '../components/organizer/Dashboard'
import PageLoader from '../components/ui/PageLoader'

/** `#/organizer` — signed-out visitors see the sign-in screen; the dashboard only renders with a session. */
export default function OrganizerPage() {
  const session = useOrganizerSession()

  if (session.status === 'loading') return <PageLoader />
  if (!session.user) return <OrganizerSignIn signIn={session.signIn} />
  return <Dashboard signOut={session.signOut} />
}
