import React from 'react';
import { Mail } from 'lucide-react';

export default function Contacts() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Контакты</h1>
        <p className="mt-2 text-stone-500">Связаться с сообществом пастелистов Казахстана можно по электронной почте.</p>
      </div>

      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-400">Email</p>
            <a
              href="mailto:pastelistykazakhstana@gmail.com"
              className="mt-2 inline-block text-lg font-semibold text-stone-900 transition-colors hover:text-amber-700"
            >
              pastelistykazakhstana@gmail.com
            </a>
            <p className="mt-3 max-w-xl text-sm leading-7 text-stone-500">
              По этому адресу можно отправлять вопросы, предложения, информацию о мероприятиях и материалы для публикации.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
