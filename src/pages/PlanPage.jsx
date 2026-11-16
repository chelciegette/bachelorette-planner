import { useParams } from 'react-router-dom'
import EditLoader from '../components/plan/EditLoader'
import ResponseForm from '../components/plan/ResponseForm'

/** The bridesmaid-facing page: `#/` for a new response, `#/edit/CODE` to update an existing one. */
export default function PlanPage() {
  const { code } = useParams()
  // Different keys → switching between "new" and "edit" always starts from a clean slate.
  return code ? <EditLoader key={`edit-${code}`} code={code} /> : <ResponseForm key="new" />
}
