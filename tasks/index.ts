import fs from "fs";
import path from "path";

//setup loadTasks function to load tasks from the tasks folder

export const loadTasks = () => {
  const taskPath = path.join(__dirname, "../tasks");

  fs.readdirSync(taskPath)
    .filter((file) => file.endsWith(".ts"))
    .forEach((task) => {
      require(`${taskPath}/${task}`);
    });
};
