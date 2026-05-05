export const DSA_PROBLEMS = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "easy",
    tags: ["Array", "Hash Map"],
    companies: ["Amazon", "Google", "Meta"],
    acceptance: "49.1%",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10⁴",
      "-10⁹ <= nums[i] <= 10⁹",
      "-10⁹ <= target <= 10⁹",
      "Only one valid answer exists.",
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Write your solution here
  
}`,
      python: `def two_sum(nums: list[int], target: int) -> list[int]:
    # Write your solution here
    pass`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        
    }
}`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        
    }
};`,
    },
    testCases: [
      { input: "[2,7,11,15], 9", expected: "[0,1]" },
      { input: "[3,2,4], 6", expected: "[1,2]" },
      { input: "[3,3], 6", expected: "[0,1]" },
    ],
    hints: [
      "A brute force approach would be O(n²). Can you do better?",
      "Think about using a hash map to store values you've already seen.",
      "For each number, check if (target - number) exists in your map.",
    ],
    solution: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
}`,
  },
  {
    id: 2,
    title: "Valid Parentheses",
    difficulty: "easy",
    tags: ["Stack", "String"],
    companies: ["Amazon", "Microsoft", "Bloomberg"],
    acceptance: "40.7%",
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    constraints: [
      "1 <= s.length <= 10⁴",
      "s consists of parentheses only '()[]{}'.",
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // Write your solution here
  
}`,
      python: `def is_valid(s: str) -> bool:
    # Write your solution here
    pass`,
      java: `class Solution {
    public boolean isValid(String s) {
        // Write your solution here
        
    }
}`,
      cpp: `class Solution {
public:
    bool isValid(string s) {
        // Write your solution here
        
    }
};`,
    },
    testCases: [
      { input: '"()"', expected: "true" },
      { input: '"()[]{}"', expected: "true" },
      { input: '"(]"', expected: "false" },
      { input: '"([)]"', expected: "false" },
    ],
    hints: [
      "Use a stack data structure.",
      "Push opening brackets onto the stack.",
      "When you see a closing bracket, check if the top of the stack is the matching opener.",
    ],
    solution: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const ch of s) {
    if ('({['.includes(ch)) stack.push(ch);
    else if (stack.pop() !== map[ch]) return false;
  }
  return stack.length === 0;
}`,
  },
  {
    id: 3,
    title: "Reverse Linked List",
    difficulty: "easy",
    tags: ["Linked List", "Recursion"],
    companies: ["Amazon", "Apple", "Adobe"],
    acceptance: "73.6%",
    description: `Given the \`head\` of a singly linked list, reverse the list, and return the reversed list.`,
    examples: [
      {
        input: "head = [1,2,3,4,5]",
        output: "[5,4,3,2,1]",
      },
      {
        input: "head = [1,2]",
        output: "[2,1]",
      },
      {
        input: "head = []",
        output: "[]",
      },
    ],
    constraints: [
      "The number of nodes in the list is the range [0, 5000].",
      "-5000 <= Node.val <= 5000",
    ],
    starterCode: {
      javascript: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *   this.val = (val===undefined ? 0 : val)
 *   this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
function reverseList(head) {
  // Write your solution here
  
}`,
      python: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

def reverse_list(head):
    # Write your solution here
    pass`,
      java: `class Solution {
    public ListNode reverseList(ListNode head) {
        // Write your solution here
        
    }
}`,
      cpp: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        // Write your solution here
        
    }
};`,
    },
    testCases: [
      { input: "[1,2,3,4,5]", expected: "[5,4,3,2,1]" },
      { input: "[1,2]", expected: "[2,1]" },
      { input: "[]", expected: "[]" },
    ],
    hints: [
      "Think about iterating through the list and reversing the pointers.",
      "You need three pointers: prev, current, and next.",
      "Can you also solve this recursively?",
    ],
    solution: `function reverseList(head) {
  let prev = null, curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}`,
  },
  {
    id: 4,
    title: "Maximum Subarray",
    difficulty: "medium",
    tags: ["Array", "Dynamic Programming", "Divide and Conquer"],
    companies: ["Amazon", "Microsoft", "Google"],
    acceptance: "50.3%",
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.`,
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "The subarray [4,-1,2,1] has the largest sum 6.",
      },
      {
        input: "nums = [1]",
        output: "1",
      },
      {
        input: "nums = [5,4,-1,7,8]",
        output: "23",
      },
    ],
    constraints: [
      "1 <= nums.length <= 10⁵",
      "-10⁴ <= nums[i] <= 10⁴",
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums) {
  // Write your solution here
  
}`,
      python: `def max_sub_array(nums: list[int]) -> int:
    # Write your solution here
    pass`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        // Write your solution here
        
    }
}`,
      cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Write your solution here
        
    }
};`,
    },
    testCases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expected: "6" },
      { input: "[1]", expected: "1" },
      { input: "[5,4,-1,7,8]", expected: "23" },
    ],
    hints: [
      "Think about Kadane's algorithm.",
      "At each position, decide: extend the current subarray or start a new one?",
      "Keep track of the maximum sum seen so far.",
    ],
    solution: `function maxSubArray(nums) {
  let maxSum = nums[0], curr = nums[0];
  for (let i = 1; i < nums.length; i++) {
    curr = Math.max(nums[i], curr + nums[i]);
    maxSum = Math.max(maxSum, curr);
  }
  return maxSum;
}`,
  },
  {
    id: 5,
    title: "Binary Search",
    difficulty: "easy",
    tags: ["Array", "Binary Search"],
    companies: ["Facebook", "Amazon", "Apple"],
    acceptance: "55.2%",
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with **O(log n)** runtime complexity.`,
    examples: [
      {
        input: "nums = [-1,0,3,5,9,12], target = 9",
        output: "4",
        explanation: "9 exists in nums and its index is 4.",
      },
      {
        input: "nums = [-1,0,3,5,9,12], target = 2",
        output: "-1",
        explanation: "2 does not exist in nums so return -1.",
      },
    ],
    constraints: [
      "1 <= nums.length <= 10⁴",
      "-10⁴ < nums[i], target < 10⁴",
      "All the integers in nums are unique.",
      "nums is sorted in ascending order.",
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function search(nums, target) {
  // Write your solution here
  
}`,
      python: `def search(nums: list[int], target: int) -> int:
    # Write your solution here
    pass`,
      java: `class Solution {
    public int search(int[] nums, int target) {
        // Write your solution here
        
    }
}`,
      cpp: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        // Write your solution here
        
    }
};`,
    },
    testCases: [
      { input: "[-1,0,3,5,9,12], 9", expected: "4" },
      { input: "[-1,0,3,5,9,12], 2", expected: "-1" },
      { input: "[5], 5", expected: "0" },
    ],
    hints: [
      "Maintain left and right pointers.",
      "Calculate mid = Math.floor((left + right) / 2).",
      "If nums[mid] === target, return mid. If less, search right half. If more, search left half.",
    ],
    solution: `function search(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
  },
  {
    id: 6,
    title: "LRU Cache",
    difficulty: "hard",
    tags: ["Hash Map", "Linked List", "Design"],
    companies: ["Amazon", "Microsoft", "Google", "Meta"],
    acceptance: "42.1%",
    description: `Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` Initialize the LRU cache with **positive** size \`capacity\`.
- \`int get(int key)\` Return the value of the \`key\` if the key exists, otherwise return \`-1\`.
- \`void put(int key, int value)\` Update the value of the \`key\` if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the \`capacity\` from this operation, **evict** the least recently used key.

The functions \`get\` and \`put\` must each run in **O(1)** average time complexity.`,
    examples: [
      {
        input: `["LRUCache","put","put","get","put","get","put","get","get","get"]
[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]`,
        output: "[null,null,null,1,null,-1,null,-1,3,4]",
      },
    ],
    constraints: [
      "1 <= capacity <= 3000",
      "0 <= key <= 10⁴",
      "0 <= value <= 10⁵",
      "At most 2 * 10⁵ calls will be made to get and put.",
    ],
    starterCode: {
      javascript: `/**
 * @param {number} capacity
 */
class LRUCache {
  constructor(capacity) {
    // Initialize your data structure here
    
  }

  /** @param {number} key @return {number} */
  get(key) {
    
  }

  /** @param {number} key @param {number} value @return {void} */
  put(key, value) {
    
  }
}`,
      python: `class LRUCache:
    def __init__(self, capacity: int):
        # Initialize your data structure here
        pass

    def get(self, key: int) -> int:
        pass

    def put(self, key: int, value: int) -> None:
        pass`,
      java: `class LRUCache {
    public LRUCache(int capacity) {
        
    }
    
    public int get(int key) {
        
    }
    
    public void put(int key, int value) {
        
    }
}`,
      cpp: `class LRUCache {
public:
    LRUCache(int capacity) {
        
    }
    
    int get(int key) {
        
    }
    
    void put(int key, int value) {
        
    }
};`,
    },
    testCases: [
      {
        input: 'LRUCache(2); put(1,1); put(2,2); get(1); put(3,3); get(2); put(4,4); get(1); get(3); get(4)',
        expected: "1, -1, -1, 3, 4",
      },
    ],
    hints: [
      "Use a combination of a HashMap and a Doubly Linked List.",
      "The HashMap gives O(1) access to nodes. The DLL maintains order.",
      "On get/put, move the accessed node to the front (most recently used).",
      "On eviction, remove the node at the tail (least recently used).",
    ],
    solution: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
    this.head = { key: 0, val: 0, prev: null, next: null };
    this.tail = { key: 0, val: 0, prev: null, next: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }
  _insertFront(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }
  get(key) {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key);
    this._remove(node);
    this._insertFront(node);
    return node.val;
  }
  put(key, value) {
    if (this.map.has(key)) this._remove(this.map.get(key));
    const node = { key, val: value, prev: null, next: null };
    this._insertFront(node);
    this.map.set(key, node);
    if (this.map.size > this.capacity) {
      const lru = this.tail.prev;
      this._remove(lru);
      this.map.delete(lru.key);
    }
  }
}`,
  },
  {
    id: 7,
    title: "Climbing Stairs",
    difficulty: "easy",
    tags: ["Dynamic Programming", "Math", "Memoization"],
    companies: ["Amazon", "Adobe", "Apple"],
    acceptance: "52.3%",
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
    examples: [
      {
        input: "n = 2",
        output: "2",
        explanation: "There are two ways to climb to the top: 1+1 and 2.",
      },
      {
        input: "n = 3",
        output: "3",
        explanation: "There are three ways: 1+1+1, 1+2, and 2+1.",
      },
    ],
    constraints: ["1 <= n <= 45"],
    starterCode: {
      javascript: `/**
 * @param {number} n
 * @return {number}
 */
function climbStairs(n) {
  // Write your solution here
  
}`,
      python: `def climb_stairs(n: int) -> int:
    # Write your solution here
    pass`,
      java: `class Solution {
    public int climbStairs(int n) {
        // Write your solution here
        
    }
}`,
      cpp: `class Solution {
public:
    int climbStairs(int n) {
        // Write your solution here
        
    }
};`,
    },
    testCases: [
      { input: "2", expected: "2" },
      { input: "3", expected: "3" },
      { input: "10", expected: "89" },
    ],
    hints: [
      "Think about it: to reach step n, you came from step n-1 or step n-2.",
      "This is essentially the Fibonacci sequence.",
      "You only need to track the last two values — O(1) space.",
    ],
    solution: `function climbStairs(n) {
  if (n <= 2) return n;
  let a = 1, b = 2;
  for (let i = 3; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}`,
  },
  {
    id: 8,
    title: "Binary Tree Zigzag Level Order Traversal",
    difficulty: "medium",
    tags: ["Tree", "BFS", "Binary Tree"],
    companies: ["Amazon", "Microsoft", "Bloomberg"],
    acceptance: "57.8%",
    description: `Given the \`root\` of a binary tree, return the zigzag level order traversal of its nodes' values (i.e., from left to right, then right to left for the next level and alternate between).`,
    examples: [
      {
        input: "root = [3,9,20,null,null,15,7]",
        output: "[[3],[20,9],[15,7]]",
      },
      {
        input: "root = [1]",
        output: "[[1]]",
      },
      {
        input: "root = []",
        output: "[]",
      },
    ],
    constraints: [
      "The number of nodes in the tree is in the range [0, 2000].",
      "-100 <= Node.val <= 100",
    ],
    starterCode: {
      javascript: `/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *   this.val = (val===undefined ? 0 : val)
 *   this.left = (left===undefined ? null : left)
 *   this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number[][]}
 */
function zigzagLevelOrder(root) {
  // Write your solution here
  
}`,
      python: `def zigzag_level_order(root) -> list[list[int]]:
    # Write your solution here
    pass`,
      java: `class Solution {
    public List<List<Integer>> zigzagLevelOrder(TreeNode root) {
        // Write your solution here
        
    }
}`,
      cpp: `class Solution {
public:
    vector<vector<int>> zigzagLevelOrder(TreeNode* root) {
        // Write your solution here
        
    }
};`,
    },
    testCases: [
      { input: "[3,9,20,null,null,15,7]", expected: "[[3],[20,9],[15,7]]" },
      { input: "[1]", expected: "[[1]]" },
      { input: "[]", expected: "[]" },
    ],
    hints: [
      "Use BFS with a queue.",
      "Track the current level and whether to reverse.",
      "Alternate the direction of insertion for each level.",
    ],
    solution: `function zigzagLevelOrder(root) {
  if (!root) return [];
  const result = [], queue = [root];
  let leftToRight = true;
  while (queue.length) {
    const size = queue.length, level = [];
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      leftToRight ? level.push(node.val) : level.unshift(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
    leftToRight = !leftToRight;
  }
  return result;
}`,
  },
];
