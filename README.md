## 📌 Project Overview

The MERN stack was used in the development of this full-stack, real-time task management application. It enables users to assign tasks intelligently, track recent activities, resolve conflicts in real time, and manage tasks using a Kanban board layout. The application is completely responsive, offers smooth functionality across devices, and supports user authentication.

---

## 🧰 Tech Stack

- **Frontend**: React.js (with few animation extentions)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Atlas)
- **Real-Time Communication**: Socket.IO
- **Authentication**: JSON Web Tokens (JWT)
- **Styling**: Custom CSS
- **Deployment**: Vercel (frontend) & Render (backend)

---

## 🚀 Setup and Installation Instructions

### 🖥️ Backend Setup

1.  Navigate to the folder where you want to set up your Server side of the project
2.  Open terminal
3.  Inside terminal ('npm init')
4.  Fill out few project details as follows
        package-name (real-time-taskmanager)
        version (1.0.0)
        discription (If any)
        entry point (index.js/server.js)
        test command
        git repo
        keywords
        author
        licence
5.  Keep the entry point as the root file
6.  Install the needed extra dependencies in the project
        "bcryptjs": "^3.0.2",
        "cors": "^2.8.5",
        "dotenv": "^17.0.1",
        "express": "^5.1.0",
        "jsonwebtoken": "^9.0.2",
        "mongodb": "^6.17.0",
        "mongoose": "^8.16.1",
        "socket.io": "^4.8.1"
7.  create .env file
        PORT=yourBackendPortURL
        MONGO_URI=yourMongodbAtlasConnectionString
        JWT_SECRET=yourJwtSecretKey
8.  Starting the server
        Terminal code:'node {your entery point}'


### 🖥️ Frontend Setup

1.  Open terminal in a new or existing folder
2.  Write inside terminal 'npx create-react-app {your application name}'
3.  Install the needed extra dependencies in the project
        "@dnd-kit/core": "^6.3.1",
        "@dnd-kit/modifiers": "^9.0.0",
        "@dnd-kit/sortable": "^10.0.0",
        "axios": "^1.10.0",
        "framer-motion": "^12.23.0",
        "react-icons": "^5.5.0",
        "react-router-dom": "^7.6.3",
        "react-scripts": "5.0.1",
        "socket.io-client": "^4.8.1",
        "sweetalert2": "^11.22.2"
4.  In terminal write {npm start}

---

## 📌 Features

- 🧾 User Registration and Login with JWT Authentication
- 📝 Create, Update, and Delete Tasks
- 🧩 Kanban Board with Drag and Drop (Todo, In Progress, Done)
- 🧠 Smart Assign: Automatically assigns task to user with fewest tasks
- ⚔️ Conflict Handling: Prevents overwriting when multiple users edit the same task
- 🔄 Real-time Task Sync using Socket.IO
- 📜 Activity Log: View the last 20 actions performed in the project
- 📱 Fully Responsive Design (Mobile + Desktop)
- 🪄 Flip Card Animation between Board and Task Form

---

## ▶️ Usage Guide

1. **Login/Register:** Start by creating an account or logging in.
2. **Kanban Board:** View all tasks organized in columns. Click on a task to view full details.
3. **Create Task:** Click "Create Task" to add a new task using the flip card UI.
4. **Drag & Drop:** Move tasks across columns to update their status.
5. **Smart Assign:** Use "Smart Assign" to let the system auto-assign tasks based on workload.
6. **Activity Log:** Click the Activity Log button in the navbar to view recent actions.
7. **Conflict Handling:** If another user updates the same task, choose to Merge or Overwrite your version.

---

## 🔀 Smart Assign – Task Auto Assignment Logic

Smart Assign is a custom made logic in the application.It allows users to automatically assign tasks to the user with the fewest active tasks. This ensured that the workload in the team is balanced and users can be assigned task automatically without checking the number of existing task user already have manually

Instead of randomly selecting a user or always assigning to the same person, Smart Assign helps distribute tasks fairly.
It is done by actively counting tasks per user before assignment

Steps Envolved to assign task:
    -When clicked on Smart Assign function handleSmartAssig() is triggered  which sends the task data (title, description, status, priority) to the backend (via POST request)
    -It does not assign tasks mannualy instead let the backend handle all the computations
    -The backend then verifies the user's identity using the JWT token sent in the request headers.
    -All users from the database are fetched so that the system has the full picture of the user that can be assigned the tasks.
    -For each user, a query is made to count how many active tasks (those with status Todo or In Progress) are assigned to them. This is done dynamically using MongoDB's aggregation or count queries.
    -After getting task counts for all users, the backend identifies the user with the lowest number of active tasks.
    -A new task is created using the data from the frontend, and it is assigned to the selected user.
    -After successful creation, the task is emitted via Socket.IO (taskCreated) so all connected clients can update in realtime.

Note:I do not keep the field taskCount in the user's database because tasks can become inconsistent or outdated when they are completed, reassigned, or removed.Instead, I count tasks dynamically while the program is still running. This ensures the count is correct and prevents redundancy.This method finishes the need for manually updating the count with every task change and guarantees real-time accuracy.

---

## ⚔️ Conflict Handling

Conflict management provides for data consistency when multiple users access the same operation at a single instant of time. For example, two users trying to move a task at the same instant will prevent unintentional overwrites or uncanny updates. In fact, in these scenarios this is extremely important in terms of the collaborative real-time applications, where actions occur simultaneously.
For Eg: If a user A drags a task X from Todo to In Progress and at that same time a user B moves that task from Todo direct to Done, this will impose a problem if not handled correctly.

### Logic Invovlved & its Implementation

-Every task has a lastModifiedAt timestamp which gets updated each time the task is changed.
-When a user attempts to update a task, the client sends the {lastModifiedAt} value along with the update request.
-On the backend, the server compares the sent {lastModifiedAt} with the current value in the database.
-If they match, the task is updated successfully
-If they don’t match, it means the task was updated recently by another user.
-When that happens the backend sends an HTTP 409 (Conflict) response with the current task’s latest data.
-On the frontend, a SweetAlert popup is shown to the user with three options
    -Merge(Pick Column): Manually choose a new column/status to place the task in.
    -Overwrite: Forcefully update the task with your version.
    -Cancel: Do nothing and revert the change.
-If the user chooses Merge or Overwrite, the frontend sends a new request with the updated lastModifiedAt and chosen status.


### Youtube Video Link

https://youtu.be/umc99BW1qBk