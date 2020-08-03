import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { AnchorPointConsumer } from '../helpers/anchor_point_consumer';
import { EMPTY_ARRAY } from '@kira/std';

/**
 * AnchorPoint
 */
export namespace AnchorPoint {
  export interface Props {
    /** Name of registered anchor point */
    name: string;

    /** String containing multiple "-" and one "x" */
    top?: string;

    /** String containing multiple "-" and one "x" */
    left?: string;
  }

  const elements = {
    anchor: styled.div`
      display: contents;
    `,
  };

  export const h: React.FC<Props> = function __kira__anchor_point({ name, top, left, children }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (ref.current === null) {
        throw new Error('no!');
      }

      if (ref.current.parentNode === null) {
        throw new Error('no!');
      }

      AnchorPointConsumer.add({
        name,
        ref: ref.current.parentNode as HTMLElement,
        top,
        left,
      });

      return () => {
        AnchorPointConsumer.destroy(name);
      };
    }, EMPTY_ARRAY);

    return <elements.anchor ref={ref}>{children}</elements.anchor>;
  };
}