import React, { FC } from 'react';
import styled from 'styled-components';
import { KiraPropType } from '../../../ui-std/src/index';

/**
 * Article
 */
export namespace Article {
  export interface Props extends KiraPropType {
    center?: boolean;
  }

  const elements = {
    article: styled.div<{ center?: boolean }>`
      display: contents;

      ${({ center }) => center && `text-align: center;`}

      p {
        margin-bottom: 10px;
      }

      h1 {
        margin-bottom: 30px;
      }

      h2 {
        margin-bottom: 30px;
      }

      h3 {
        margin-bottom: 30px;
      }

      h4 {
        margin-bottom: 30px;
      }

      h5 {
        margin-bottom: 15px;
      }

      h6 {
        margin-bottom: 5px;
      }
    `,
  };

  export const h: FC<Props> = function Kira_Article({ children, className, center, ...rest }) {
    return (
      <elements.article center={center} className={className} {...rest}>
        {children}
      </elements.article>
    );
  };
}