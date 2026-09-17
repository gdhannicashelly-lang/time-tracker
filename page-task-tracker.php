<?php
/**
 * Template Name: Task Tracker
 * Template Post Type: page
 * Description: A custom task tracker template with Kanban-style layout
 */
get_header(); ?>

<style>
/* ==============================================
   TASK TRACKER STYLING
   ============================================== */
.tracker-wrap {
    max-width: 1200px;
    margin: 0 auto;
    padding: 30px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.tracker-header {
    text-align: center;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 2px solid #eee;
}

.tracker-header h1 {
    color: #1a1a1a;
    margin: 0 0 10px;
    font-size: 2.2rem;
}

.tracker-header p {
    color: #666;
    font-size: 1.1rem;
}

/* KANBAN BOARD LAYOUT */
.task-board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}

/* COLUMN COMMON */
.task-column {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 15px;
    min-height: 400px;
}

.task-column h3 {
    text-align: center;
    padding: 10px;
    border-radius: 8px;
    color: #fff;
    margin: 0 0 15px;
    font-size: 1rem;
}

/* COLUMN COLORS */
.column-pending h3      { background: #f59e0b; }
.column-progress h3     { background: #3b82f6; }
.column-completed h3    { background: #10b981; }

/* TASK CARD */
.task-card {
    background: #ffffff;
    padding: 14px;
    margin-bottom: 12px;
    border-radius: 8px;
    border-left: 4px solid #ccc;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    transition: transform 0.2s, box-shadow 0.2s;
}

.task-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.08);
}

.task-card.pending    { border-left-color: #f59e0b; }
.task-card.progress   { border-left-color: #3b82f6; }
.task-card.completed  { border-left-color: #10b981; opacity: 0.9; }

.task-card strong {
    display: block;
    margin-bottom: 6px;
    color: #1a1a1a;
    font-size: 0.95rem;
}

.task-card .meta {
    font-size: 0.85rem;
    color: #6b7280;
}

/* BOTTOM SECTION */
.plugin-section {
    margin-top: 50px;
    padding-top: 30px;
    border-top: 2px solid #eee;
}

/* RESPONSIVE — MOBILE FRIENDLY */
@media (max-width: 768px) {
    .task-board { grid-template-columns: 1fr; }
    .tracker-header h1 { font-size: 1.6rem; }
}
</style>

<div class="tracker-wrap">

    <!-- HEADER -->
    <div class="tracker-header">
        <h1>📋 My Task Tracker</h1>
        <p>Stay organized — track tasks, deadlines, and progress</p>
    </div>

    <!-- KANBAN BOARD -->
    <div class="task-board">

        <!-- ⏳ PENDING TASKS -->
        <div class="task-column column-pending">
            <h3>⏳ Pending</h3>
            
            <div class="task-card pending">
                <strong>Design Homepage Layout</strong>
                <span class="meta">📅 Deadline: 2026-09-15</span>
            </div>

            <div class="task-card pending">
                <strong>Write Project Documentation</strong>
                <span class="meta">📅 Deadline: 2026-09-20</span>
            </div>
        </div>

        <!-- 🔄 IN PROGRESS -->
        <div class="task-column column-progress">
            <h3>🔄 In Progress</h3>
            
            <div class="task-card progress">
                <strong>Build Task Tracker Template</strong>
                <span class="meta">📅 Deadline: 2026-09-10</span>
            </div>
        </div>

        <!-- ✅ COMPLETED -->
        <div class="task-column column-completed">
            <h3>✅ Completed</h3>
            
            <div class="task-card completed">
                <strong>Setup WordPress Website</strong>
                <span class="meta">✅ Finished 2026-09-05</span>
            </div>
        </div>

    </div><!-- END .task-board -->

    <!-- PLUGIN INTEGRATION (SHOW LIVE TASKS) -->
    <div class="plugin-section">
        <h2>📊 Live Tasks from Plugin</h2>
        <?php
        // If you install LazyTasks or another plugin, its tasks will show below
        if (function_exists('do_shortcode')) {
            echo do_shortcode('[lazytasks]');
        } else {
            echo '<p style="color:#888; font-style:italic;">⚠️ Install a task plugin (like LazyTasks) to see live, editable tasks here.</p>';
        }
        ?>
    </div>

</div>

<?php get_footer(); ?>