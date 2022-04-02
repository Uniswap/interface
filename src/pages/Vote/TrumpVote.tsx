import { ButtonPrimary } from "components/Button";
import { BlueCard, OutlineCard, DarkCard } from "components/Card";
import Tooltip from "components/Tooltip";
import React from "react";
import { ChevronLeft, Info, ThumbsDown, ThumbsUp } from "react-feather";
import { useIsDarkMode } from "state/user/hooks";
import styled from "styled-components/macro";
import { TYPE } from "theme";
import { IconWrapper } from "theme/components";
import { StyledInternalLink } from "theme/components";
import { Proposal } from "./AddProposal";
import moment from "moment";
import Badge from "components/Badge";
export const TrumpVote = () => {
  const [proposals, setProposals] = React.useState<Proposal[]>([]);
  React.useEffect(() => {
    // fetch proposal data
    fetch(`https://api.babytrumptoken.com/proposal`, { method: "GET" })
      .then((res) => res.json())
      .then(setProposals);
  }, []);

  const Header = styled.div`
    display: flex;
    padding: 15px;
    margin-bottom: 15px;
    font-size: 24px;
    width: 100%;
  `;

  const Body = styled.div`
    display: flex;
    padding: 15px;
    margin-bottom: 15px;
    font-size: 12px;
    overflow: scroll;
    width: 100%;
  `;
  const isDark = useIsDarkMode();
  const [show, setShow] = React.useState(false);
  const message =
    "Proposals are created by members of the KibaInu community who own atleast 2000 Trumpgold. A proposal is then voted on by members of the community (Anyone who owns any of our tokens).";

  return (
    <BlueCard style={{ maxWidth: 800 }}>
      <OutlineCard style={{ display: "flex", flexFlow: "column wrap" }}>
        <Header>
          <TYPE.main> Proposals &nbsp;</TYPE.main>
          <Tooltip show={show} text={message}>
            <Info
              onMouseEnter={() => setShow(true)}
              onMouseLeave={() => setShow(false)}
            />
          </Tooltip>
        </Header>

        <Body>
          {proposals && proposals.length > 0 && (
            <ul style={{ padding: 9 }}>
              {proposals.map((proposal) => (
                <li key={proposal._id} style={{ display: "flex" }}>
                  <div style={{ display: "block", margin: "20px 0px" }}>
                    <StyledInternalLink
                      style={{ fontSize: 16, color: isDark ? "#fff" : "#222" }}
                      to={`/proposal/details/${proposal._id}`}
                    >
                      {'"'}
                      {proposal.title}
                      {'"'} created by: {proposal.proposedBy}
                    </StyledInternalLink>
                    <div style={{ display: "inline-flex", marginLeft: 10 }}>
                      <IconWrapper style={{ width: 30, height: 30 }}>
                        <ThumbsUp />{" "}
                        {
                          proposal.votes.filter(
                            (vote: { wallet: string; vote: boolean }) =>
                              !!vote.vote
                          ).length
                        }
                      </IconWrapper>
                      <IconWrapper style={{ width: 30, height: 30 }}>
                        <ThumbsDown />{" "}
                        {
                          proposal.votes.filter(
                            (vote: { wallet: string; vote: boolean }) =>
                              !vote.vote
                          ).length
                        }
                      </IconWrapper>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: 'center', flexFlow: 'column wrap', marginTop: 20}}>
                    {7 -
                      moment(new Date()).diff(
                        moment(proposal.createdAt),
                        "days"
                      ) >
                      0 && (
                      <Badge>
                        Expires in{" "}
                        {7 -
                          moment(new Date()).diff(
                            moment(proposal.createdAt),
                            "days"
                          )}{" "}
                        day
                      </Badge>
                    )}
                    {7 -
                      moment(new Date()).diff(
                        moment(proposal.createdAt),
                        "days"
                      ) <=
                      0 && <><br/> {proposal.votes.filter((a:any) => !a.vote).length > proposal.votes.filter((a: any) => !!a.vote).length ? <Badge style={{color:'red'}}>Denied</Badge> : <Badge style={{color:'green'}}>Approved</Badge>}</>}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {proposals.length === 0 && (
            <DarkCard>
              <TYPE.main>
                No proposals found.{" "}
                <StyledInternalLink
                  style={{ color: "#fff" }}
                  to="/proposal/create"
                >
                  Create a proposal now.
                </StyledInternalLink>
              </TYPE.main>
            </DarkCard>
          )}
        </Body>

        <div style={{ width: "100%", padding: "15px 0px" }}>
          <ButtonPrimary
            onClick={(e) => document.getElementById("idA")?.click()}
          >
            {" "}
            <StyledInternalLink
              id="idA"
              style={{ width: "100%", color: "#fff" }}
              to="/proposal/create"
            >
              Create a proposal now.
            </StyledInternalLink>
          </ButtonPrimary>
        </div>
      </OutlineCard>
    </BlueCard>
  );
};
