// Constants
export const POMODORO_CONSTANTS = {
  WORK_DURATION: 25,
  SHORT_BREAK: 5,
  LONG_BREAK: 30,
  POMODOROS_BEFORE_LONG_BREAK: 4
};

export const CONGRATS_MESSAGES = [
  'Great work! 🎉',
  'You crushed it! 💪',
  'Keep up the momentum! 🚀',
  'Fantastic progress! ⭐'
];

/**
 * Updates the user's Pomodoro streak in KV storage
 * @param {Object} env - Environment variables including KV namespace
 * @param {string} userId - Discord user ID
 * @param {boolean} increment - Whether to increment (true) or reset (false) the streak
 * @returns {Promise<number>} The new streak count
 */
async function updateStreak(env, userId, increment = true) {
  const key = `streak:${userId}`;
  let streak = 0;

  try {
    const currentStreak = await env.POMODORO_STORAGE.get(key);
    streak = currentStreak ? parseInt(currentStreak, 10) : 0;

    if (increment) {
      streak += 1;
    } else {
      streak = 0;
    }

    // Store the updated streak
    await env.POMODORO_STORAGE.put(key, streak.toString());
    return streak;
  } catch (error) {
    console.error('Error updating streak:', error);
    return 0;
  }
}

// Command definition
export const pomodoroCommand = {
  name: 'pomodoro',
  description: 'Start a Pomodoro timer',
  options: [
    {
      name: 'action',
      description: 'What action to perform',
      type: 3, // STRING
      required: true,
      choices: [
        { name: 'help', value: 'help' },
        { name: 'start', value: 'start' },
        { name: 'stop', value: 'stop' },
        { name: 'join', value: 'join' }
      ]
    }
  ]
};

// Command execution
export async function execute(interaction, env) {
  if (!interaction.data?.options?.[0]?.value) {
    return {
      type: 4,
      data: {
        content: 'Invalid action',
        flags: 64
      }
    };
  }

  const action = interaction.data.options[0].value;

  if (action === 'help') {
    return {
      type: 4,
      data: {
        content: `**Pomodoro Technique Guide:**
1. Create a list of tasks ordered by importance
2. Set a timer to ${POMODORO_CONSTANTS.WORK_DURATION} minutes
3. Work on a task for the duration of the timer
4. Take a ${POMODORO_CONSTANTS.SHORT_BREAK} minute break
5. After ${POMODORO_CONSTANTS.POMODOROS_BEFORE_LONG_BREAK} pomodoros, take a ${POMODORO_CONSTANTS.LONG_BREAK} minutes break

Use \`/pomodoro start\` to begin!`,
        flags: 64 // ephemeral
      }
    };
  }

  if (!interaction.member?.user?.id) {
    return {
      type: 4,
      data: {
        content: 'Invalid user',
        flags: 64
      }
    };
  }

  if (action === 'stop') {
    await updateStreak(env, interaction.member.user.id, false);
    return {
      type: 4,
      data: { content: 'Pomodoro timer stopped. Your streak has been reset.' }
    };
  }

  const newStreak = await updateStreak(env, interaction.member.user.id);
  const randomCongrats = CONGRATS_MESSAGES[Math.floor(Math.random() * CONGRATS_MESSAGES.length)];
  const breakDuration = newStreak >= POMODORO_CONSTANTS.POMODOROS_BEFORE_LONG_BREAK
    ? POMODORO_CONSTANTS.LONG_BREAK
    : POMODORO_CONSTANTS.SHORT_BREAK;

  if (newStreak >= POMODORO_CONSTANTS.POMODOROS_BEFORE_LONG_BREAK) {
    await updateStreak(env, interaction.member.user.id, false);
    return {
      type: 4,
      data: {
        content: `🏆 AMAZING! You've completed ${POMODORO_CONSTANTS.POMODOROS_BEFORE_LONG_BREAK} pomodoros! Time for a well-deserved ${POMODORO_CONSTANTS.LONG_BREAK} minute break!\nhttps://giphy.com/gifs/studiosoriginals-3oz8xAFtqoOUUrsh7W`
      }
    };
  }

  return {
    type: 4,
    data: {
      content: `${randomCongrats} Time for a ${breakDuration} minute break.`
    }
  };
} 