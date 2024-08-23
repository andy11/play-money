import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { getMyBalance } from '@play-money/api-helpers/client'
import { NotificationDropdown } from '@play-money/notifications/components/NotificationDropdown'
import { GlobalSearchTriggerLink } from '@play-money/search/components/GlobalSearchTriggerLink'
import { Badge } from '@play-money/ui/badge'
import { Button } from '@play-money/ui/button'
import { Sheet, SheetTrigger, SheetContent, SheetClose } from '@play-money/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@play-money/ui/tooltip'
import { cn } from '@play-money/ui/utils'
import { UserNav } from '@play-money/users/components/UserNav'

function MainNav({
  className,
  renderItemWrap = (children) => children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { renderItemWrap?: (children: React.ReactNode) => React.ReactNode }) {
  return
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let initialBalance
  try {
    const { balance } = await getMyBalance()
    initialBalance = balance
  } catch (_error) {
    // Ignore
  }
  let siteTitle
  siteTitle = process.env.SITE_TITLE

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex w-full flex-col justify-between border-b">
        <div className="flex h-16 items-center justify-between gap-4 px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="md:hidden" size="icon" variant="outline">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col gap-4">
                <span className="text-lg font-bold tracking-tight text-muted-foreground">PlayMoney</span>
                <MainNav
                  className="flex flex-col items-start space-y-4 text-lg"
                  renderItemWrap={(child) => <SheetClose asChild>{child}</SheetClose>}
                />
              </div>
            </SheetContent>
          </Sheet>
          <Link className="flex items-center gap-2" href="/">
            <span className="text-lg font-bold tracking-tight text-muted-foreground">{siteTitle}</span>
          </Link>
          <MainNav className="hidden gap-6 md:flex" />

          <div className="ml-auto flex items-center space-x-2">
            <NotificationDropdown />
            <UserNav initialBalance={initialBalance} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-screen-xl flex-1 space-y-4 p-4 md:p-8">{children}</div>

      <div className="mx-auto flex gap-4 p-4 text-sm text-muted-foreground md:p-8">
      </div>
    </div>
  )
}
