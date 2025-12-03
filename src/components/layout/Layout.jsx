import { RoleBasedSidebar } from './RoleBasedSidebar'
import { Header } from './Header'

export const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-dark overflow-hidden">
      <RoleBasedSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
