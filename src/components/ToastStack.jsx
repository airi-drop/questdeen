function ToastStack({ toasts }) {
  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          className="rounded-2xl border border-[#c7dbc0] bg-[#fffdf7]/95 p-4 text-sm shadow-[0_16px_40px_rgba(44,35,19,0.14)] backdrop-blur-xl dark:border-[#2ddfa3]/20 dark:bg-[#10241d]/95"
          key={toast.id}
        >
          <p className="font-bold text-[#17352b] dark:text-[#f7f3e8]">
            {toast.title}
          </p>
          <p className="mt-1 text-[#6f7e76] dark:text-[#a7b8b2]">
            {toast.message}
          </p>
        </div>
      ))}
    </div>
  )
}

export default ToastStack
