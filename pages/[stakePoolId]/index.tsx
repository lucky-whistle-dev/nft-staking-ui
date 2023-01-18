import type { StakePoolMetadata } from 'api/mapping'
import { Footer } from 'common/Footer'
import { FooterSlim } from 'common/FooterSlim'
import { Header } from 'common/Header'
import { HeroLarge } from 'common/HeroLarge'
import { Info } from 'common/Info'
import { TabSelector } from 'common/TabSelector'
import { contrastColorMode } from 'common/utils'
import { AttributeAnalytics } from 'components/AttributeAnalytics'
import { PerformanceStats } from 'components/PerformanceStats'
import { StakePoolLeaderboard } from 'components/StakePoolLeaderboard'
import { StakePoolNotice } from 'components/StakePoolNotice'
import { useRewardDistributorData } from 'hooks/useRewardDistributorData'
import { useStakedTokenDatas } from 'hooks/useStakedTokenDatas'
import { useStakePoolData } from 'hooks/useStakePoolData'
import { useStakePoolMetadata } from 'hooks/useStakePoolMetadata'
import { useUserRegion } from 'hooks/useUserRegion'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { StakedTokens } from '@/components/token-staking/staked-tokens/StakedTokens'
import { UnstakedTokens } from '@/components/token-staking/unstaked-tokens/UnstakedTokens'

type PANE_OPTIONS = 'dashboard' | 'leaderboard'
const paneTabs: {
  label: React.ReactNode
  value: PANE_OPTIONS
  disabled?: boolean
  tooltip?: string
}[] = [
  {
    label: 'Dashboard',
    value: 'dashboard',
    tooltip: 'View your personal dashboard',
  },
  {
    label: 'Leaderboard',
    value: 'leaderboard',
    tooltip: 'View top users in this pool',
  },
]

function StakePoolHome(props: {
  fetchedStakePoolData: StakePoolMetadata | null
}) {
  const router = useRouter()
  const { isFetched: stakePoolLoaded } = useStakePoolData()
  const userRegion = useUserRegion()
  const rewardDistributorData = useRewardDistributorData()
  const stakedTokenDatas = useStakedTokenDatas()
  const [pane, setPane] = useState<PANE_OPTIONS>('dashboard')

  const { data: stakePoolMetadata } = useStakePoolMetadata()

  if (stakePoolMetadata?.redirect) {
    router.push(stakePoolMetadata?.redirect)
    return <></>
  }

  if (
    !stakePoolLoaded ||
    (stakePoolMetadata?.disallowRegions && !userRegion.isFetched)
  ) {
    return (
      <>
        <Head>
          <title>
            {props.fetchedStakePoolData?.displayName?.replace(' Staking', '') +
              ' Staking' ?? 'Cardinal NFT Staking'}
          </title>
          {props.fetchedStakePoolData?.displayName?.replace(' Staking', '') +
            ' Staking' ?? 'Cardinal NFT Staking'}
          <meta
            name="title"
            content={
              props.fetchedStakePoolData?.displayName?.replace(
                ' Staking',
                ''
              ) ?? 'NFT Staking on Solana'
            }
          />
          <meta
            name="description"
            content={
              'Stake your ' +
                props.fetchedStakePoolData?.displayName?.replace(
                  ' Staking',
                  ''
                ) +
                ' powered by Cardinal Staking' ??
              'Stake your NFTs powered by Cardinal Staking'
            }
          />
          <meta name="image" content="https://stake.cardinal.so/preview.png" />
          <meta
            name="og:image"
            content="https://stake.cardinal.so/preview.png"
          />
          <link
            rel="icon"
            href={props.fetchedStakePoolData?.imageUrl ?? `/favicon.ico`}
          />
          <script
            defer
            data-domain="stake.cardinal.so"
            src="https://plausible.io/js/plausible.js"
          ></script>
        </Head>
      </>
    )
  }

  if (
    stakePoolMetadata?.disallowRegions &&
    !userRegion.data?.isAllowed &&
    !process.env.BYPASS_REGION_CHECK
  ) {
    return (
      <div
        className="flex min-h-screen flex-col"
        style={{
          background: stakePoolMetadata?.colors?.primary,
          backgroundSize: 'cover',
          backgroundImage: `url(${stakePoolMetadata?.backgroundImage})`,
        }}
      >
        <Header />
        <div className="max flex grow items-center justify-center">
          <div className="w-[600px] max-w-[95vw] rounded-xl bg-black bg-opacity-50 p-10 text-center">
            <div className="text-2xl font-bold">
              Users from Country ({userRegion.data?.countryName}) are not
              Eligible to Participate
            </div>
            <div className="mt-8 text-sm text-light-2">
              It is prohibited to use certain services offered by Parcl if you
              are a resident of, or are located, incorporated, or have a
              registered agent in, {userRegion.data?.countryName} or any other
              jurisdiction where the Services are restricted.
            </div>
          </div>
        </div>
        <FooterSlim />
      </div>
    )
  }

  return (
    <div
      style={{
        background: stakePoolMetadata?.colors?.primary,
        backgroundSize: 'cover',
        backgroundImage: `url(${stakePoolMetadata?.backgroundImage})`,
      }}
    >
      <Head>
        <title>
          {stakePoolMetadata?.displayName.replace(' Staking', '') +
            ' Staking' ?? 'Cardinal NFT Staking'}
        </title>
        {stakePoolMetadata?.displayName + ' Staking' ?? 'Cardinal NFT Staking'}
        <meta
          name="title"
          content={
            stakePoolMetadata?.displayName.replace(' Staking', '') +
              ' Staking' ?? 'NFT Staking on Solana'
          }
        />
        <meta
          name="description"
          content={
            'Stake your ' +
              stakePoolMetadata?.displayName +
              ' powered by Cardinal Staking' ??
            'Stake your NFTs powered by Cardinal Staking'
          }
        />
        <meta name="image" content="https://stake.cardinal.so/preview.png" />
        <meta name="og:image" content="https://stake.cardinal.so/preview.png" />
        <link rel="icon" href={stakePoolMetadata?.imageUrl ?? `/favicon.ico`} />
        <script
          defer
          data-domain="stake.cardinal.so"
          src="https://plausible.io/js/plausible.js"
        ></script>
      </Head>
      <Header />
      <div
        className="relative z-0 mx-10 mt-4 mb-8 flex flex-col gap-4"
        style={{
          ...stakePoolMetadata?.styles,
          color:
            stakePoolMetadata?.colors?.fontColor ??
            contrastColorMode(
              stakePoolMetadata?.colors?.primary || '#000000'
            )[0],
        }}
      >
        <HeroLarge />
        <AttributeAnalytics />
        <div className="flex justify-end">
          <TabSelector<PANE_OPTIONS>
            colors={{
              background: stakePoolMetadata?.colors?.backgroundSecondary,
              color: stakePoolMetadata?.colors?.secondary,
            }}
            defaultOption={paneTabs[0]}
            options={paneTabs}
            value={paneTabs.find((p) => p.value === pane)}
            onChange={(o) => {
              setPane(o.value)
            }}
          />
        </div>
        {
          {
            dashboard: (
              <div className="flex flex-col gap-4">
                {!!rewardDistributorData.data &&
                  !!stakedTokenDatas.data?.length && (
                    <Info
                      colorized
                      icon="performance"
                      header="Personal Charts"
                      description="View your recent performance"
                      style={{ color: stakePoolMetadata?.colors?.fontColor }}
                      content={
                        <div className="flex grow items-center justify-end">
                          <PerformanceStats />
                        </div>
                      }
                    />
                  )}
                <StakePoolNotice />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <UnstakedTokens />
                  <StakedTokens />
                </div>
              </div>
            ),
            leaderboard: <StakePoolLeaderboard />,
          }[pane]
        }
      </div>
      {!stakePoolMetadata?.hideFooter ? (
        <Footer bgColor={stakePoolMetadata?.colors?.primary} />
      ) : (
        <div className="h-24"></div>
      )}
    </div>
  )
}

export default StakePoolHome
