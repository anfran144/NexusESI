import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/seedbed-leader/eventos')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/seedbed-leader/eventos"!</div>
}
