// ask permission
export const requestPermission = async () => {
  if (!("Notification" in window)) {
    alert("Browser does not support notifications");
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
};


// save reminder
export const addReminder = (contest) => {
  const reminders = JSON.parse(localStorage.getItem("contestReminders")) || [];

  // avoid duplicate
  if (reminders.find(r => r.url === contest.url)) return;

  reminders.push(contest);
  localStorage.setItem("contestReminders", JSON.stringify(reminders));
};


// check reminders
export const startReminderService = () => {

  setInterval(() => {

    const reminders = JSON.parse(localStorage.getItem("contestReminders")) || [];
    const now = Date.now();

    const remaining = [];

    reminders.forEach(contest => {

      const notifyTime = contest.startTime - 10 * 60 * 1000; // 10 minutes before

      if (now >= notifyTime && now <= contest.startTime) {

        new Notification("Contest Starting Soon!", {
          body: `${contest.name} starts in 10 minutes!`,
          icon: "/vite.svg"
        });

      } else if (now < contest.startTime) {
        remaining.push(contest);
      }

    });

    localStorage.setItem("contestReminders", JSON.stringify(remaining));

  }, 30000); // every 30 seconds
};
