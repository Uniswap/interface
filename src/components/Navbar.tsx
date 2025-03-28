import Link from 'next/link'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from './ui/navigation-menu'
import { Button } from './ui/button'

export function Navbar() {
  return (
    <>
      <header className="absolute top-0 left-0 p-4 flex space-x-4">
        <h2 className="text-xl font-semibold text-white">ZeroFlow</h2>
        <div className="flex justify-center w-full">
          <NavigationMenu className="gap-3 list-none">
            <NavigationMenuItem>
              <Link href="/trade" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>Trade</NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/pool" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>Pool</NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenu>
        </div>
      </header>
      <Button
        variant="secondary"
        className="absolute top-0 right-0 m-4 text-white cursor-pointer rounded-xl bg-violet-800
                    px-3 py-1 text-[10px] md:px-4 md:py-2 md:text-base"
      >
        Connect Wallet
      </Button>
    </>
  )
}
