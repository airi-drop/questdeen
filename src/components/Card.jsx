function Card({ children, className = '' }) {
  return (
    <section
      className={`min-w-0 rounded-[1.75rem] border border-[#e4dccb] bg-[#fffdf7] p-5 shadow-[0_16px_40px_rgba(44,35,19,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(44,35,19,0.10)] dark:border-white/10 dark:bg-[#10241d] dark:shadow-[0_16px_40px_rgba(0,0,0,0.16)] ${className}`}
    >
      {children}
    </section>
  )
}

export default Card
