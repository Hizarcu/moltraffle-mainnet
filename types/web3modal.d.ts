import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        balance?: 'show' | 'hide';
        disabled?: boolean;
        size?: string;
        label?: string;
        loadingLabel?: string;
      }, HTMLElement>;
    }
  }
}
