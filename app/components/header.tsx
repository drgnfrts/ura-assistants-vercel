export function Header() {
  /**
   * Header Component. Parent: Layout
   * Adapted from DCG Assistant
   *
   * @returns React.ReactNode
   */
  return (
    <header className="sticky top-0 z-50 flex items-center justify-center w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <h1 className="text-white">Feedback Analytics Assistant [URA Demo]</h1>
    </header>
  );
}
