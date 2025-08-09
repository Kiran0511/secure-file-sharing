interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="w-full py-8 text-center animate-fade-in">
      <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "#E0E0E0" }}>
        {title}
      </h1>
    </header>
  )
}
