document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select to the default option to avoid duplicates
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name} <span class="participant-count">${(details.participants || []).length}</span></h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section">
            <p><strong>Participants:</strong></p>
            <ul class="participants-list">
              ${
                (details.participants || []).length
                  ? (details.participants || []).map(p => `
                      <li data-email="${p}">
                        <span class="participant-name">${p}</span>
                        <button class="delete-participant" aria-label="Unregister ${p}">×</button>
                      </li>
                    `).join("")
                  : '<li class="no-participants">No participants yet</li>'
              }
            </ul>
          </div>
        `;

        // Add delete handler for participants (event delegation)
        const participantsList = activityCard.querySelector('.participants-list');
        participantsList && participantsList.addEventListener('click', async (evt) => {
          const button = evt.target.closest('.delete-participant');
          if (!button) return;

          const li = button.closest('li');
          if (!li) return;

          const email = li.dataset.email;
          if (!email) return;

          try {
            const resp = await fetch(`/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`, {
              method: 'DELETE'
            });
            const result = await resp.json();

            if (resp.ok) {
              // Remove the list item
              li.remove();

              // Update participant count badge
              const countEl = activityCard.querySelector('.participant-count');
              const current = parseInt(countEl.textContent || '0', 10);
              const newCount = Math.max(0, current - 1);
              countEl.textContent = newCount;

              // Update availability text
              const availabilityEl = activityCard.querySelector('.availability');
              const spots = details.max_participants - newCount;
              availabilityEl.textContent = `${spots} spots left`;

              // If no participants left, show empty state
              const ul = activityCard.querySelector('.participants-list');
              if (newCount === 0 && ul) {
                const no = document.createElement('li');
                no.className = 'no-participants';
                no.textContent = 'No participants yet';
                ul.appendChild(no);
              }

              messageDiv.textContent = result.message;
              messageDiv.className = 'success';
            } else {
              messageDiv.textContent = result.detail || 'Failed to remove participant';
              messageDiv.className = 'error';
            }
          } catch (error) {
            messageDiv.textContent = 'Failed to remove participant. Please try again.';
            messageDiv.className = 'error';
            console.error('Error removing participant:', error);
          }

          messageDiv.classList.remove('hidden');
          setTimeout(() => messageDiv.classList.add('hidden'), 5000);
        });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
