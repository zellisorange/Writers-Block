// PROJECT SWITCHER - Active Project Management
// This manages switching between projects, saving, and tracking current project

class ProjectSwitcher {
  constructor() {
    this.currentProject = this.loadCurrentProject();
    this.projects = this.loadProjects();
  }

  /**
   * Load current active project from localStorage
   */
  loadCurrentProject() {
    const current = localStorage.getItem('theblock_current_project');
    return current ? JSON.parse(current) : null;
  }

  /**
   * Load all projects
   */
  loadProjects() {
    return JSON.parse(localStorage.getItem('theblock_projects') || '[]');
  }

  /**
   * Set active project
   */
  setCurrentProject(projectId) {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      this.currentProject = project;
      localStorage.setItem('theblock_current_project', JSON.stringify(project));
      return true;
    }
    return false;
  }

  /**
   * Get current project
   */
  getCurrentProject() {
    return this.currentProject;
  }

  /**
   * Save current project content
   */
  saveCurrentProject(content, chapters = null) {
    if (!this.currentProject) {
      alert('No active project!');
      return false;
    }

    const projects = this.loadProjects();
    const index = projects.findIndex(p => p.id === this.currentProject.id);

    if (index >= 0) {
      projects[index].content = content;
      if (chapters) projects[index].chapters = chapters;
      projects[index].updatedAt = new Date().toISOString();
      
      localStorage.setItem('theblock_projects', JSON.stringify(projects));
      localStorage.setItem('theblock_current_project', JSON.stringify(projects[index]));
      
      this.currentProject = projects[index];
      return true;
    }
    return false;
  }

  /**
   * Save chapter to current project
   */
  saveChapter(chapterId, content) {
    if (!this.currentProject) {
      alert('No active project!');
      return false;
    }

    const projects = this.loadProjects();
    const projectIndex = projects.findIndex(p => p.id === this.currentProject.id);

    if (projectIndex >= 0) {
      const chapters = projects[projectIndex].chapters || [];
      const chapterIndex = chapters.findIndex(c => c.id === parseInt(chapterId));

      if (chapterIndex >= 0) {
        chapters[chapterIndex].content = content;
        projects[projectIndex].chapters = chapters;
        projects[projectIndex].updatedAt = new Date().toISOString();
        
        localStorage.setItem('theblock_projects', JSON.stringify(projects));
        this.currentProject = projects[projectIndex];
        return true;
      }
    }
    return false;
  }

  /**
   * Create new project and set as current
   */
  createAndSetProject(title) {
    const projects = this.loadProjects();
    
    const newProject = {
      id: 'project_' + Date.now(),
      title: title,
      content: '',
      chapters: [{ id: 1, title: 'Chapter 1', content: '' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projects.push(newProject);
    localStorage.setItem('theblock_projects', JSON.stringify(projects));
    
    this.setCurrentProject(newProject.id);
    return newProject;
  }

  /**
   * Get all projects
   */
  getAllProjects() {
    return this.loadProjects();
  }

  /**
   * Get project by ID
   */
  getProject(projectId) {
    return this.projects.find(p => p.id === projectId);
  }
}

// Create global instance
const projectSwitcher = new ProjectSwitcher();