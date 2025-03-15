// Look for sections that display non-negotiable tasks
// For example, if there's a section like:
<div>
  <h3>Today's Non-Negotiables</h3>
  {tasks.map(task => (
    <TaskItem key={task.id} task={task} />
  ))}
</div>

// Change it to:
<div>
  <h3>Today's Non-Negotiables</h3>
  {tasks
    .filter(task => isToday(new Date(task.dueDate)) && task.isNonNegotiable === true)
    .map(task => (
      <TaskItem key={task.id} task={task} />
    ))
  }
</div>

// Also check for any other task rendering in this file to ensure proper filtering 