import { MinusIcon } from '@heroicons/react/24/solid'
import classNames from 'classnames'

export type ButtonDecrementProps = {
  onClick: () => void
  className?: string
}

export const ButtonDecrement = ({
  onClick,
  className,
}: ButtonDecrementProps) => {
  return (
    <button
      className={classNames([
        'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gray-600 p-2 outline outline-gray-600',
        className,
      ])}
      onClick={onClick}
    >
      <MinusIcon className="h-4 w-4 text-gray-400" />
    </button>
  )
}
