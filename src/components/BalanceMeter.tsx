import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

interface BalanceMeterProps {
  diversityScore: number       // 0–1
  scarcityScore: number        // 0–100, higher = more scarce
  chaosScore: number | null    // 0–100, higher = more unpredictable; null while loading
}

interface Grade {
  label: string
  color: string
  textColor: string
  description: string
}

function balanceGrade(score: number): Grade {
  if (score > 75) return {
    label: 'Balanced',
    color: '#22c55e',
    textColor: 'text-green-400',
    description: 'Multiple positions contribute meaningfully to weekly scoring.',
  }
  if (score >= 60) return {
    label: 'Somewhat balanced',
    color: '#eab308',
    textColor: 'text-yellow-400',
    description: 'Some positional dominance, but variety still matters.',
  }
  return {
    label: 'One-dimensional',
    color: '#ef4444',
    textColor: 'text-red-400',
    description: 'One position dominates — season may feel narrow.',
  }
}

function scarcityGrade(score: number): Grade {
  if (score < 40) return {
    label: 'Deep',
    color: '#22c55e',
    textColor: 'text-green-400',
    description: 'Plenty of startable talent available to draft and claim.',
  }
  if (score <= 65) return {
    label: 'Moderate',
    color: '#eab308',
    textColor: 'text-yellow-400',
    description: 'Some positions will be competitive — depth matters.',
  }
  return {
    label: 'Tight',
    color: '#ef4444',
    textColor: 'text-red-400',
    description: 'Most viable players will be rostered — target depth early.',
  }
}

function chaosGrade(score: number): Grade {
  if (score < 35) return {
    label: 'Consistent',
    color: '#22c55e',
    textColor: 'text-green-400',
    description: 'Scores are predictable — reliable starters hold steady value.',
  }
  if (score <= 65) return {
    label: 'Mixed',
    color: '#eab308',
    textColor: 'text-yellow-400',
    description: 'Some positions swing week to week — handcuffs and depth picks matter.',
  }
  return {
    label: 'Chaotic',
    color: '#ef4444',
    textColor: 'text-red-400',
    description: 'Scores are hard to predict — matchups and luck have outsized impact.',
  }
}

function GaugeCard({
  label,
  score,
  grade,
  legendItems,
}: {
  label: string
  score: number
  grade: Grade
  legendItems: { color: string; text: string }[]
}) {
  const chartData = [
    { value: score,       fill: grade.color   },
    { value: 100 - score, fill: '#374151' },
  ]

  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{label}</p>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="70%"
              outerRadius="100%"
              data={chartData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar dataKey="value" cornerRadius={4} background={false} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-lg sm:text-xl font-bold ${grade.textColor}`}>{score}</span>
            <span className="text-xs text-gray-500">/100</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-semibold ${grade.textColor} mb-1`}>{grade.label}</div>
          <p className="text-xs text-gray-400 leading-relaxed">{grade.description}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
            {legendItems.map((item) => (
              <span key={item.text}>
                <span style={{ color: item.color }}>●</span> {item.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BalanceMeter({ diversityScore, scarcityScore, chaosScore }: BalanceMeterProps) {
  const balScore = Math.round(diversityScore * 100)
  const bal  = balanceGrade(balScore)
  const scar = scarcityGrade(scarcityScore)

  return (
    <div className="bg-gray-800 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-5">
        League Grades
      </h3>

      {/* 1-col on mobile, 3-col on sm+. Dividers switch from horizontal to vertical. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y divide-gray-700 sm:divide-y-0 sm:divide-x">
        <div className="pb-5 sm:pb-0 sm:pr-5">
          <GaugeCard
            label="Positional Balance"
            score={balScore}
            grade={bal}
            legendItems={[
              { color: '#22c55e', text: '76–100 Balanced' },
              { color: '#eab308', text: '60–75 Somewhat' },
              { color: '#ef4444', text: '<60 One-dimensional' },
            ]}
          />
        </div>

        <div className="py-5 sm:py-0 sm:px-5">
          <GaugeCard
            label="Scarcity Pressure"
            score={scarcityScore}
            grade={scar}
            legendItems={[
              { color: '#22c55e', text: '<40 Deep' },
              { color: '#eab308', text: '40–65 Moderate' },
              { color: '#ef4444', text: '66+ Tight' },
            ]}
          />
        </div>

        <div className="pt-5 sm:pt-0 sm:pl-5">
          {chaosScore !== null ? (
            <GaugeCard
              label="Chaos"
              score={chaosScore}
              grade={chaosGrade(chaosScore)}
              legendItems={[
                { color: '#22c55e', text: '<35 Consistent' },
                { color: '#eab308', text: '35–65 Mixed' },
                { color: '#ef4444', text: '66+ Chaotic' },
              ]}
            />
          ) : (
            <div className="space-y-3 animate-pulse">
              <div className="h-3 w-16 bg-gray-700 rounded" />
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-700 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 bg-gray-700 rounded" />
                  <div className="h-3 w-full bg-gray-700 rounded" />
                  <div className="h-3 w-3/4 bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
