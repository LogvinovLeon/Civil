import * as React from "react";
import styled, { StyledComponentClass } from "styled-components";
import { colors, fonts } from "../styleConstants";

export interface StepStyledProps {
  index: number;
}

export const StepStyled = styled.div`
  border-top: 1px solid ${colors.accent.CIVIL_GRAY_4};
  padding: 23px 4px 37px 50px;
  width: 600px;
  position: relative;
  &:after{
    content: "${(props: StepStyledProps) => props.index + 1}";
    position: absolute;
    left: 3px;
    top: 20px;
    height: 10px;
    font-family: ${fonts.SANS_SERIF};
    font-size: 16px;
    font-weight: 400;
  }
`;
